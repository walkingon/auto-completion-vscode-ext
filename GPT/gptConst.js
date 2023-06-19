const Role = {
    System: 'system',
    Assistant: 'assistant',
    User: 'user',
    Func: 'function'
}
const Message = {
    role: Role,
    content: '',
    name: '',
    function_call: {}
}
const Func = {
    name: '',
    description: '',
    parameters: {}
}

//持久化存储的配置参数名称
const StoreConfigName = {
	API: {
		URL: 'url',
		APIKEY: 'apiKey'
	},
	GPT: {
		MODEL: 'model',
		TEMPERATURE: 'temperature',
		MAX_TOKENS: 'max_tokens'
	}
}

module.exports.Role = Role
module.exports.Message = Message
module.exports.Func = Func
module.exports.StoreConfigName = StoreConfigName