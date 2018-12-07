# Contents Feed Backend

* **주요 목표** 

  1. 컨텐츠 공급자로부터 데이터를 조회 하여 각 사용자에게 특정 기준(ex, 시간순)으로 재 정렬하여 제공해야 함.
     - 컨텐츠 공급자(API 제공자)는 추천순으로 제공하며 시간에 따라 변화
     - 각 사용자별로 추천순위가 다름.
  2. 각 사용자별 사용 이력을 관리가 가능 해야 함.
     - 어디까지 열람했는지 알 수 있어야 함.
     - 사용자가 더보기 할 경우 신규 데이터만 제공 가능해야 함.
  3. 무중단 서비스가 되어야 하며 확장성이 용이해야함.
     - 컨텐츠 공급자가 서비스 불가능 상태여도 서비스는 정상적으로 되어야 함.
     - 추후 확장성이 용이한 구조를 가져야 함.
  4. 성능
     - 최대 1000ms 내에 처리 되어야 함.

* **부가 목표**

  1. 시스템 상황의 모니터링이 가능 해야 함.
     * API의 호출수, 실패 수, 평균 응답시간 등
     * 캐시를 사용할경우 hit/miss ratio 등

* 시스템 목적

  1. 성능(I/O 발생 최소화) + 부가 기능



---



## Redis 키 구조 및 설계 목적

- Key 구조

  - 사용자 Contents

    - Sorted Set 이용 ( 작성시간 기준 오름차순 정렬 )
    - Key (사용자 ID)
      - user:{userId}:contents
    - Score (작성시간)
    - Member (뉴스기사 ID)

  - Contents

    - Key-Value 구조 이용

    - Key (뉴스기사 ID)

    - Value (Contents)

- 설계 목적

  - Sorted Set을 사용해서 요청 시 마다 정렬하는 것이 아니라 미리 정렬해둔 데이터를 응답
  - Redis에 데이터가 없고 갱신주기가 지났을 경우에만 API 호출 ( API 호출 최소화 )
  - Sorted Set에 member로 뉴스기사 ID를 저장하고 Contents를 따로 저장하여 사용 용량 최소화 ( 유저마다 Contents를 저장하지 않는다. )



---



## 기능 별 동작

### 초기 1 페이지 조회

* URI

  | Method | Route                            | Description      |
  | ------ | -------------------------------- | ---------------- |
  | GET    | /contents/{lastRenewal}/{userId} | 초기 페이지 요청 |

* Parameter

  * lastRenewal : 마지막 Contents API Server 호출 시간
  * userId : 사용자 ID



* 동작 과정
  * userId Parameter 값 확인 ( 존재하지 않는다면 비회원 )
  * Redis에서 가장 최신글 N개 뉴스 기사 ID 조회
    * 다음 세 가지 조건을 만족하는 경우 Contents API Server 호출
      * Redis에 조회한 데이터가 없는 경우
      * 회원인 경우
      * 갱신 시간이 지난 경우
  * Redis에서 N개 뉴스 기사 내용 조회
  * 데이터 응답
    * 마지막 갱신 시간
    * 뉴스 기사 N개


### 과거 더 보기

- URI

  | Method | Route                                                        | Description  |
  | ------ | ------------------------------------------------------------ | ------------ |
  | GET    | /contents/pastContents/{pastContentId}/{lastRenewal}/{userId} | 과거 더 보기 |

- Parameter

  - pastContentId : 사용자가 마지막으로 본 가장 과거 뉴스 ID
  - lastRenewal : 마지막 Contents API Server 호출 시간
  - userId : 사용자 ID



- 동작 과정
  - userId Parameter 값 확인 ( 존재하지 않는다면 비회원 )
  - Redis에서 Parameter로 받은 pastContent Index(Rank) 조회
    - pastContent가 존재하지 않는다면 초기 페이지 요청 ( 가장 최근 데이터 10개 응답 )
  - Index를 기준으로 과거 데이터 뉴스 기사 ID N개 조회 ( [Index - N]부터 [Index - 1]까지 )
    - 다음 세 가지 조건을 만족하는 경우 Contents API Server 호출
      - Redis에 조회한 데이터가 없는 경우
      - 회원인 경우
      - 갱신 시간이 지난 경우
  - Redis에서 N개 뉴스 기사 내용 조회
  - 데이터 응답
    - 마지막 갱신 시간
    - 뉴스 기사 N개



### 최신 더 보기

- URI

  | Method | Route                                                        | Description  |
  | ------ | ------------------------------------------------------------ | ------------ |
  | GET    | /contents/pastContents/{newContentId}/{lastRenewal}/{userId} | 과거 더 보기 |

- Parameter

  - newContentId : 사용자가 마지막으로 본 가장 최신 뉴스 ID
  - lastRenewal : 마지막 Contents API Server 호출 시간
  - userId : 사용자 ID



- 동작 과정
  - userId Parameter 값 확인 ( 존재하지 않는다면 비회원 )
  - Redis에서 Parameter로 받은 newContent Index(Rank) 조회
    - pastContent가 존재하지 않는다면 초기 페이지 요청 ( 가장 최근 데이터 10개 응답 )
  - Index를 기준으로 최근 데이터 뉴스 기사 ID N개 조회 ( [Index + 1]부터 [Index + N]까지 )
    - 다음 세 가지 조건을 만족하는 경우 Contents API Server 호출
      - Redis에 조회한 데이터가 없는 경우
      - 회원인 경우
      - 갱신 시간이 지난 경우
  - Redis에서 N개 뉴스 기사 내용 조회
  - 데이터 응답
    - 마지막 갱신 시간
    - 뉴스 기사 N개



---

## 예외 처리

### Contents API Server 장애 발생

* 스케줄링
  * 비회원 데이터를 일정 주기 간격으로 데이터를 저장
  * 장애 발생 시 미리 저장해 놓은 비회원 데이터 응답



---



## 성능 개선 방안

* Local Cache
  * 뉴스 기사 데이터를 Local Cache에 저장
  * 작성 시간이 24시간이 경과할 경우 스케줄링을 통해 삭제
  * 하루 기사의 수가 평균 1만건 정도 이므로 Local Cache 용량 Issue가 발생하지 않음
  * Redis 조회 전 Local Cache를 먼저 조회

* Redis pipeline
  * zadd를 이용하여 N개의 데이터를 N번의 I/O가 발생
  * Redis pipleline을 이용하여 I/O를 줄임
  * 하나의 명령이 실행된 후 결과를 확인하는 시점이 있는데 서버는 다음 명령을 실행하여 이 시간을 줄임

* Redis Clustring
  * Clustring을 통해 용량과 처리량의 제약이 없는 복수 Cluster 제공

* zdd option
  * option 설정을 통해 Redis의 작업 시간 감소

* mget
  * 여러 개의 key를 한 번의 명령으로 조회하여 I/O를 줄임



---



## 정책 설정 값

- 요청 API Server 추천 Data 개수 : 80
- 사용자에게 응답하는 Contents 개수 : 20
- 갱신 주기 : 5분
- 삭제 주기 또는 만료 시간 : 24시간 (작성 시간 기준)


