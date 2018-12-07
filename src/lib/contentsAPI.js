const request = require('request-promise')
const moment = require('moment')

/* contents Dao */
const contentsDao = require('../dao/contentsDao')

/* contents API Dao */
const contentsApiDao = require('../dao/contentsApiDao')

const { apiLogger } = require('../lib/winston')

const { numOfRecommend, numOfContents, refreshTime, deleteTime } = require('../lib/serviceData')

module.exports = {
    /* 추천데이터 불러오기 */
    getRecommend
}

async function getRecommend(userId) {
    console.log('api server call !')
    
    const key = 'user:' + userId + ':contents'

    let st
    if(userId != 'global'){
        st = 'rec'
    }
    else{
        st = 'global'
        userId = ''
    }
    /* URI */
    const option = {
        method: 'GET',
        uri: 'http://0.0.0.0/api?st=' + st + '&display=' + numOfRecommend + userId,
        json: true
    }

    /* Contents API Server 호출 */
    let apiResult
    try{
        apiResult = await request(option);
    }
    catch(error){
        throw new Error("Contents Server Error")
    }

    /* 응답에서 추천 데이터 추출 */
    const recommend = apiResult.result.recommend

    /* 추천 데이터 Redis 저장 */
    for (var i = 0; i < recommend.length; i++) {
        /* score 생성 : 작성 시간을 seconds로 변환 */
        var score = (new Date(recommend[i].dt_svc)).getTime() / 1000

        /* data 생성 */
        var data = {
            "title": recommend[i].title,
            "image": recommend[i].image,
            "office_name": recommend[i].office_name,
            "writing_time": recommend[i].dt_svc,
            "url": recommend[i].url
        }

        /* 
         Redis에 contents 저장 

         Key : user:userId:contents
         Score : writingTime(milliseconds)
         Member : Contents Data
        */
        await contentsDao.addContents(key, score, JSON.stringify(data))
    }

    /* API 호출 수 조회 */
    let numOfApiCall = await contentsApiDao.getNumOfApiCall('numOfApiCall')
    numOfApiCall = (numOfApiCall == null) ? 1 : ++numOfApiCall

    /* API 호출 수 set */
    await contentsApiDao.setNumOfApiCall('numOfApiCall', numOfApiCall)

    /* log */
    const logData = {
        "time": moment().format('MMMM DD YYYY, h:mm:ss a'),
        "numOfApiCall": numOfApiCall,
        "message" : "API log"
    }

    apiLogger.api(logData)


    /* 현재 시간 (마지막 갱신시간) 반환 */
    return (new Date()).getTime()
}