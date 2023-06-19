const gptConst = require('./gptConst')
const { createParser } = require('eventsource-parser')
const fetch = require('node-fetch');
const vscode = require('vscode');

/**
 * GPT聊天接口
 * @param {{
 * messages: [gptConst.Message],
 * functions: [gptConst.Func],
 * function_call: ''
 * }} params 网络请求参数
 * @param {Function} finishCb 响应完成回调
 * @param {Function} streamCb 流式响应过程回调，多次回调
 */
async function chat(params, finishCb, streamCb) {
    let APIConfig = vscode.workspace.getConfiguration('API')
    let apiUrl = APIConfig.get(gptConst.StoreConfigName.API.URL)
    let apiKey = APIConfig.get(gptConst.StoreConfigName.API.APIKEY)

    if (typeof (apiUrl) != 'string' || apiUrl.length == 0) {
        vscode.window.showErrorMessage('未设置URL')
        return
    }
    if (typeof (apiKey) != 'string' || apiKey.length == 0) {
        vscode.window.showErrorMessage('未设置API KEY')
        return
    }
    console.log(params.messages[0].content)

    let GPTConfig = vscode.workspace.getConfiguration('GPT')
    let model = GPTConfig.get(gptConst.StoreConfigName.GPT.MODEL)
    let temperature = GPTConfig.get(gptConst.StoreConfigName.GPT.TEMPERATURE)
    let max_tokens = GPTConfig.get(gptConst.StoreConfigName.GPT.MAX_TOKENS)

    // @ts-ignore
    const response = await fetch(apiUrl,
        {
            method: 'POST',
            headers: {
                'Accept': 'text/event-stream',
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: params.messages,
                temperature: temperature,
                stream: true,
                max_tokens: max_tokens
            })
        }
    ).catch((err) => {
        console.error(err)
    })
    encoderStreamData(response.body, finishCb, streamCb)
}

/**
 * 流式响应数据解析
 * @param {*} body 
 * @param {Function} finishCb 
 * @param {Function} streamCb 
 */
async function encoderStreamData(body, finishCb, streamCb) {
    const decoder = new TextDecoder();
    // 使用 eventsource-parser 库来解析body
    const parser = createParser((event) => {
        if (event.type === 'event') {
            // 如果接收到的消息是 [DONE] 则表示流式响应结束了
            // https://platform.openai.com/docs/api-reference/chat/create#chat/create-stream
            if (event.data === '[DONE]') {
                if (finishCb) finishCb('[DONE]')
                return;
            }
            try {
                // 每个 event.data 都是 JSON 字符串
                const chunkJSON = JSON.parse(event.data);
                // 获取 delta.content
                const content = (chunkJSON.choices[0].delta).content;
                if (content) {
                    if (streamCb) streamCb(content)
                }
            } catch (e) {
                console.error(e)
            }
        }
    });
    for await (const chunk of body) {
        parser.feed(decoder.decode(chunk));
    }
}


module.exports.chat = chat