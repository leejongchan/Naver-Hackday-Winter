const { respondJson, respondOnError } = require('../lib/response')

const contentsService = require('../service/contentsService')

module.exports = {
    /* 초기 데이터 불러오기 */
    getFirstContents,

    /* 과거 데이터 불러오기 */
    getPastContents,

    /* 최신 데이터 블로오기 */
    getNewContents
}

async function getFirstContents(req, res) {

    /* coockie 저장 */
    let contentsInfo = (req.cookies.contentsInfo != undefined) ? req.cookies.contentsInfo : {}

    /* userId */
    let userId = (req.params.userId == undefined) ? 'global' : req.params.userId

    const reqInfo = {
        /* 요청 URI */
        "pathname": `${req.method} ${req._parsedOriginalUrl.pathname}`,
        /* 요청 시작 시간 */
        "startTime": new Date()
    }

    try {
        /* 마지막 갱신 시간 */
        const lastRenewal = (Object.getOwnPropertyNames(contentsInfo).length == 0) ? 0 : req.cookies.contentsInfo['lastRenewal']

        /* Service 호출 */
        const result = await contentsService.findFirstContents(userId, lastRenewal)

        /* set cookie */
        contentsInfo = {
            'pastContent': result.contents[0],
            'newContent': result.contents[result.contents.length - 1],
            'lastRenewal': result.lastRenewal
        }

        res.cookie('contentsInfo', contentsInfo, {
            maxAge: 1000000
        })

        /* Response */
        respondJson("Success", result.contents, res, 200, reqInfo);
    }
    catch (error) {
        if (error.message == "Contents Server Error") {
            /* Service 호출 */
            const result = await contentsService.findGlobalContents(userId, -1, contentsInfo)

            /* set cookie */
            contentsInfo = {
                'pastContent': result.contents[0],
                'newContent': result.contents[result.contents.length - 1],
                'lastRenewal': result.lastRenewal
            }

            res.cookie('contentsInfo', contentsInfo, {
                maxAge: 1000000
            })

            /* Response */
            respondJson("Success", result.contents, res, 200, reqInfo);
        }
        else{
            respondOnError('Internal Server Error', res, 500, error, reqInfo);
        }
    }
}

async function getPastContents(req, res) {

    /* coockie 저장 */
    let contentsInfo = (req.cookies.contentsInfo != undefined) ? req.cookies.contentsInfo : {}

    /* userId */
    let userId = (req.params.userId == undefined) ? 'global' : req.params.userId

    const reqInfo = {
        /* 요청 URI */
        "pathname": `${req.method} ${req._parsedOriginalUrl.pathname}`,
        /* 요청 시작 시간 */
        "startTime": new Date()
    }

    try {
        let result

        /* 쿠키가 존재 하지 않으면 초기 페이지 요청 */
        if (Object.getOwnPropertyNames(contentsInfo).length == 0) {
            /* Service 호출 */
            result = await contentsService.findFirstContents(userId, 0)

            contentsInfo = {
                'pastContent': result.contents[0],
                'newContent': result.contents[result.contents.length - 1],
                'lastRenewal': result.lastRenewal
            }
        }
        else {
            /* Service 호출 */
            result = await contentsService.findPastContents(userId, contentsInfo['lastRenewal'], JSON.stringify(contentsInfo['pastContent']))

            contentsInfo['lastRenewal'] = result.lastRenewal
            if (result.contents.length != 0) {
                contentsInfo['pastContent'] = result.contents[0]
            }
        }

        /* set cookie */
        res.cookie('contentsInfo', contentsInfo, {
            maxAge: 86400000
        })

        /* Response */
        respondJson("Success", result.contents, res, 200, reqInfo);
    }
    catch (error) {
        if (error.message == "Contents Server Error") {
            /* Service 호출 */
            const result = await contentsService.findGlobalContents(userId, -1, contentsInfo)

            /* set cookie */
            contentsInfo = {
                'pastContent': result.contents[0],
                'newContent': result.contents[result.contents.length - 1],
                'lastRenewal': result.lastRenewal
            }

            res.cookie('contentsInfo', contentsInfo, {
                maxAge: 1000000
            })

            /* Response */
            respondJson("Success", result.contents, res, 200, reqInfo);
        }
        else{
            respondOnError('Internal Server Error', res, 500, error, reqInfo);
        }
    }
}

async function getNewContents(req, res) {
    
    /* coockie 저장 */
    let contentsInfo = (req.cookies.contentsInfo != undefined) ? req.cookies.contentsInfo : {}

    /* userId */
    let userId = (req.params.userId == undefined) ? 'global' : req.params.userId

    const reqInfo = {
        /* 요청 URI */
        "pathname": `${req.method} ${req._parsedOriginalUrl.pathname}`,
        /* 요청 시작 시간 */
        "startTime": new Date()
    }

    try {
        let result

        /* 쿠키가 존재 하지 않으면 초기 페이지 요청 */
        if (Object.getOwnPropertyNames(contentsInfo).length == 0) {
            /* Service 호출 */
            result = await contentsService.findFirstContents(userId, 0)

            contentsInfo = {
                'pastContent': result.contents[0],
                'newContent': result.contents[result.contents.length - 1],
                'lastRenewal': result.lastRenewal
            }
        }
        else {
            /* Service 호출 */
            result = await contentsService.findNewContents(userId, contentsInfo['lastRenewal'], JSON.stringify(contentsInfo['newContent']))

            contentsInfo['lastRenewal'] = result.lastRenewal
            if (result.contents.length != 0) {
                contentsInfo['newContent'] = result.contents[result.contents.length - 1]
            }
        }

        /* set cookie */
        res.cookie('contentsInfo', contentsInfo, {
            maxAge: 86400000
        })

        /* Response */
        respondJson("Success", result.contents, res, 200, reqInfo);
    }
    catch (error) {
        if (error.message == "Contents Server Error") {
            
            /* Service 호출 */
            const result = await contentsService.findGlobalContents(userId, -1, contentsInfo)

            /* set cookie */
            contentsInfo = {
                'pastContent': result.contents[0],
                'newContent': result.contents[result.contents.length - 1],
                'lastRenewal': result.lastRenewal
            }

            res.cookie('contentsInfo', contentsInfo, {
                maxAge: 1000000
            })

            /* Response */
            respondJson("Success", result.contents, res, 200, reqInfo);
        }
        else{
            respondOnError('Internal Server Error', res, 500, error, reqInfo);
        }
    }
}