/* redis */
const redis = require('redis');
const client = redis.createClient();

/* util */
const util = require('util');

module.exports = {
    /* Redis에 Contents 저장 */
    addContents,

    /* Contents Index(Rank) 추출 */
    getIndex,

    /* range로 Contents 추출 */
    getContentsByRange,

    /* 모든 Key 추출 */
    getAllKeys,

    /* score를 이용한 Contents 삭제 */
    deleteContents,

    /* range로 Contents 추출 withscores */
    getContentsByRangeWithScores,

    /* key 제거 */
    removeKey
}

async function addContents(key, score, member) {
    console.log(`zdd : ${key}`)

    const zadd = util.promisify(client.zadd).bind(client)

    await zadd(key, score, member)
}

async function getIndex(key, member) {
    console.log(`zrank : ${key}`)

    const zrank = util.promisify(client.zrank).bind(client)

    /* index(rank) 가져오기 */
    const result = await zrank(key, member)

    return result
}

async function getContentsByRange(key, begin, end) {
    console.log(`zrange : ${key}`)

    const zrange = util.promisify(client.zrange).bind(client)

    /* range로 contents 가져오기 */
    const result = await zrange(key, begin, end)
    
    for (var i = 0; i < result.length; i++) {
        result[i] = JSON.parse(result[i])
    }

    return result
}

async function getAllKeys() {
    console.log(`key : ${key}`)

    const keys = util.promisify(client.keys).bind(client)

    /* 모든 key 가져오기 */
    const result = await keys('*')

    return result
}

async function deleteContents(key, minScore, maxScore) {
    console.log(`zremrangebyscore : ${key}`)

    const zremrangebyscore = util.promisify(client.zremrangebyscore).bind(client)

    /* 해당 범위 contents 제거 */
    await zremrangebyscore(key, minScore, maxScore)
}

async function getContentsByRangeWithScores(key, begin, end){
    console.log(`zrange withscores : ${key}`)

    const zrange = util.promisify(client.zrange).bind(client)

    /* range로 contents 가져오기 */
    const result = await zrange(key, begin, end, 'WITHSCORES')

    for (var i = 0; i < result.length; i++) {
        result[i] = JSON.parse(result[i])
    }

    return result
}

async function removeKey(key){
    console.log(`del : ${key}`)

    const del = util.promisify(client.del).bind(client)

    /* key 제거 */
    await del(key)
}