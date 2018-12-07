/* contents API Server Library */
const contentsAPI = require('../lib/contentsAPI')

/* contents Dao */
const contentsDao = require('../dao/contentsDao')

const { numOfRecommend, numOfContents, refreshTime, deleteTime } = require('../lib/serviceData')

module.exports = {
    /* 초기 데이터 불러오기 */
    findFirstContents,

    /* 과거 데이터 불러오기 */
    findPastContents,

    /* 최신 데이터 불러오기 */
    findNewContents,

    /* Contents Server Error 발생할 경우 */
    findGlobalContents
}

async function findFirstContents(userId, lastRenewal) {
    /* redis key */
    const key = 'user:' + userId + ':contents'

    /* 최신글 N개 가져오기 */
    let contents = await contentsDao.getContentsByRange(key, -1 - numOfContents, -1)

    /* Redis에 Data가 없는 경우 */
    if (contents.length == 0 && userId != "global") {
        const timeDifference = (new Date).getTime() - lastRenewal

        /* 갱신 시간이 지난 경우 */
        if (timeDifference > refreshTime) {
            /* 추천 데이터 저장 */
            lastRenewal = await contentsAPI.getRecommend(userId)

            /* 최신글 N개 가져오기 */
            contents = await contentsDao.getContentsByRange(key, -1 - numOfContents, -1)
        }
    }

    result = {
        contents,
        lastRenewal
    }

    return result
}

async function findPastContents(userId, lastRenewal, pastContent) {
    /* redis key */
    const key = 'user:' + userId + ':contents'

    /* 가장 과거 데이터 index 가져오기 */
    let index = await contentsDao.getIndex(key, pastContent)

    /* 과거글 N개 가져오기 */
    let contents = await contentsDao.getContentsByRange(key, index - numOfContents, index - 1)

    /* Redis에 Data가 없는 경우 */
    if (contents.length == 0 && userId != "global") {
        const timeDifference = (new Date).getTime() - lastRenewal

        /* 갱신 시간이 지난 경우 */
        if (timeDifference > refreshTime) {
            /* 추천 데이터 저장 */
            lastRenewal = await contentsAPI.getRecommend(userId)

            /* 가장 과거 데이터 index 가져오기 */
            index = await contentsDao.getIndex(key, pastContent)

            /* 과거글 N개 가져오기 */
            contents = await contentsDao.getContentsByRange(key, index - numOfContents, index - 1)
        }
    }

    const result = {
        contents,
        lastRenewal
    }

    return result
}

async function findNewContents(userId, lastRenewal, newContent) {
    /* redis key */
    const key = 'user:' + userId + ':contents'

    /* 가장 최신 데이터 index 가져오기 */
    let index = await contentsDao.getIndex(key, newContent)

    /* 최신글 N개 가져오기 */
    let contents = await contentsDao.getContentsByRange(key, index + 1, index + numOfContents)

    /* Redis에 Data가 없는 경우 */
    if (contents.length == 0 && userId != "global") {
        const timeDifference = (new Date).getTime() - lastRenewal

        /* 갱신 시간이 지난 경우 */
        if (timeDifference > refreshTime) {
            /* 추천 데이터 저장 */
            lastRenewal = await contentsAPI.getRecommend(userId)

            /* 가장 최신 데이터 index 가져오기 */
            index = await contentsDao.getIndex(key, newContent)

            /* 최신글 N개 가져오기 */
            contents = await contentsDao.getContentsByRange(key, index + 1, index + numOfContents)
        }
    }

    const result = {
        contents,
        lastRenewal
    }

    return result
}


async function findGlobalContents(userId, type, contentsInfo) {
    /* type : 초기 요청(-1), 과거 더 보기(0), 최신 더 보기 (1) */

    let contents
    const lastRenewal = (new Date()).getTime()

    /* redis key */
    const key = 'user:' + userId + ':contents'
    const global = 'user:global:contents'

    /* 비회원 데이터 가져오기 */
    const newContents = await contentsDao.getContentsByRangeWithScores(global, 0, -1)

    /* 비회원 데이터 유저에 넣기 */
    for (var i = 0; i < newContents.length; i += 2) {
        await contentsDao.addContents(key, newContents[i + 1], JSON.stringify(newContents[i]))
    }

    /* 초기 요청 */
    if(type == -1){
        /* 최신글 N개 가져오기 */
        contents = await contentsDao.getContentsByRange(key, -1 - numOfContents, -1)
    }
    else if (type == 0) {
        /* 가장 과거 데이터 index 가져오기 */
        const index = await contentsDao.getIndex(key, JSON.stringify(contentsInfo['pastContent']))

        /* 과거글 N개 가져오기 */
        contents = await contentsDao.getContentsByRange(key, index - numOfContents, index - 1)
    }
    else if(type == 1){
        /* 가장 최신 데이터 index 가져오기 */
        const index = await contentsDao.getIndex(key, JSON.stringify(contentsInfo['newContent']))

        /* 최신글 N개 가져오기 */
        contents = await contentsDao.getContentsByRange(key, index + 1, index + numOfContents)
    }

    const result = {
        contents,
        lastRenewal
    }

    return result
}