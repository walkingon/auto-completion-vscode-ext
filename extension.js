const vscode = require('vscode');
const gpt = require('./GPT/gpt');
const { Role } = require('./GPT/gptConst');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('auto-completion 已激活')
	let commands = vscode.commands

	let dspPrompt = commands.registerTextEditorCommand('prompt', onCommandPrompt)
	let dspCodeCompletion = commands.registerTextEditorCommand('codeCompletion', onCommandCodeCompletion)
	let dspCodeExplain = commands.registerTextEditorCommand('codeExplain', onCommandCodeExplain)
	let dspCustom = commands.registerTextEditorCommand('custom', onCommandCustom)

	context.subscriptions.push(dspPrompt);
	context.subscriptions.push(dspCodeCompletion);
	context.subscriptions.push(dspCodeExplain);
	context.subscriptions.push(dspCustom);
}

//询问AI
function onCommandPrompt() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	const selection = editor.selection;
	const text = editor.document.getText(selection);

	startProcess({
		prePrompt: '',
		selection: text,
		outputType: 2,
		finishTip: "AutoCompletion: 回答完成."
	})
}

//代码补全
function onCommandCodeCompletion() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	const selection = editor.selection;
	const lang = editor.document.languageId
	const text = editor.document.getText(selection);

	startProcess({
		prePrompt: `根据以下信息补全${lang}代码，直接回复代码内容，如需解释请使用代码注释`,
		selection: text,
		outputType: 1,
		finishTip: "AutoCompletion: 补全完成."
	})
}

//代码解释
function onCommandCodeExplain() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	const selection = editor.selection;
	const text = editor.document.getText(selection);

	startProcess({
		prePrompt: '解释一下这段代码',
		selection: text,
		outputType: 2,
		finishTip: "AutoCompletion: 解释完成."
	})
}

//自定义Prompt方式
function onCommandCustom() {
	vscode.window.showInputBox({
		prompt: '请输入前置Prompt (用于拼接在选中内容的前面)',
		value: ''
	}).then((pre => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const selection = editor.selection;
		const text = editor.document.getText(selection);

		const items = [
			{ label: '1', description: '插入到当前文件光标位置' },
			{ label: '2', description: '显示在“输出”面板中' }
		]
		const options = {
			title: '响应内容输出到哪里？'
		}
		vscode.window.showQuickPick(items, options).then((selectedItem) => {
			if (selectedItem) {
				let outType = parseInt(selectedItem.label)
				startProcess({
					prePrompt: pre,
					selection: text,
					outputType: outType,
					finishTip: "AutoCompletion: 自定义Prompt响应完成."
				})
			}
		});
	}))
}

/**
 * 开始prompt过程
 * @param {{
 * prePrompt,
 * selection,
 * outputType,
 * finishTip
 * }} options prePrompt前置prompt；selection选中的内容；outputType输出方式，1插入到当前文档，2输出到面板；finishTip完成时的提示
 */
function startProcess(options) {
	let ask = ''
	if (options.prePrompt == '' && options.selection == '') {
		return
	} else {
		if (options.prePrompt != '' && options.selection != '') {
			ask = `${options.prePrompt}: \n${options.selection}`
		} else {
			ask = `${options.prePrompt}${options.selection}`
		}
	}
	if (options.outputType == 1) {
		//插入到文档
		appendText('\n')
		promptAI(ask, (txt) => {
			vscode.window.showInformationMessage(`${options.finishTip}`)
			vscode.workspace.saveAll()
		}, (txt) => {
			appendText(txt)
		})
	} else if (options.outputType == 2) {
		//输出到面板
		const outputChannel = vscode.window.createOutputChannel('AutoCompletion');
		outputChannel.show()
		promptAI(ask, (txt) => {
			vscode.window.showInformationMessage(`${options.finishTip}`)
		}, (txt) => {
			outputChannel.append(txt)
		})
	}
}

/**
 * 询问AI
 * @param {string} content 发送给AI的内容
 * @param {Function} finishCbk AI响应完成回调
 * @param {Function} streamCbk AI流式响应回调
 */
function promptAI(content, finishCbk, streamCbk) {
	let msgs = [];
	msgs.push({
		role: Role.User,
		content: content
	});
	//回复的完整内容，用于校验
	let reply = ''
	gpt.chat(
		{
			// @ts-ignore
			messages: msgs,
			// @ts-ignore
			functions: [],
			function_call: ''
		},
		(text) => {
			console.log(reply)
			if (finishCbk) finishCbk(text)
		},
		(text) => {
			reply += text
			if (streamCbk) streamCbk(text)
		}
	)

}

//用于显示
let TEXT = []
function appendText(text) {
	TEXT.push(text)
	consumeText()
}

//正在插入
let busy = false
function consumeText() {
	if (busy || TEXT.length == 0) return
	//编辑器异步插入过程中TEXT还在不断增长
	//编辑器有可能插入失败
	busy = true
	let tryInsertArr = Array.from(TEXT)
	let tx = tryInsertArr.join('')

	insert(tx).then((suc) => {
		//删除插入成功的元素
		console.log(suc, tx)
		TEXT.splice(0, tryInsertArr.length)
		busy = false
		consumeText()
	}).catch((err) => {
		//重试插入
		console.log(err, tx)
		busy = false
		consumeText()
	})
}

function insert(tx) {
	return new Promise((resolve, reject) => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) reject('not found editor.')
		editor.edit(editBuilder => {
			editBuilder.insert(editor.selection.active, tx)
		}).then(success => {
			if (success) {
				const position = editor.selection.active;
				const range = new vscode.Range(position, position);
				// 滚动到当前光标所在的位置
				editor.revealRange(range, vscode.TextEditorRevealType.Default);
				resolve('success')
			} else {
				reject('edit failed.')
			}
		})
	})
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
