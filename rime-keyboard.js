const RIME_KEY = { backspace: 0xff08, enter: 0xff0d, space: 0x20 }

function contextSnapshot(session) {
  const context = session.context
  return {
    preedit: context?.preedit ?? "",
    candidates: context?.menu?.candidates?.map((candidate) => candidate.text) ?? [],
    schemaName: session.currentSchema?.name ?? "Rime",
    asciiMode: session.getOption("ascii_mode"),
  }
}

async function createRimeKeyboard(engine, keyboard) {
  await engine.setup()
  const schemas = await engine.listSchemas()
  if (!schemas.length) throw new Error("未找到输入方案；请先在 Scripting 中导入并部署 Rime 方案")

  let selected = engine.getCurrentSchema()
  if (!selected || !schemas.some((schema) => schema.id === selected.id)) {
    selected = schemas.find((schema) => schema.id === "luna_pinyin") ?? schemas[0]
    await engine.selectSchema(selected.id)
  }

  const session = new engine.Session()
  let closed = false

  function synchronize() {
    const commit = session.commit
    if (commit) keyboard.insertText(commit)
    const snapshot = contextSnapshot(session)
    if (snapshot.preedit) keyboard.setMarkedText(snapshot.preedit, 0, 0)
    else keyboard.unmarkText()
    return snapshot
  }

  return {
    snapshot: () => contextSnapshot(session),
    pressKey(keyCode) {
      if (closed) return contextSnapshot(session)
      const consumed = session.processKey(keyCode)
      if (!consumed) {
        if (keyCode === RIME_KEY.backspace) keyboard.deleteBackward()
        else if (keyCode === RIME_KEY.space) keyboard.insertText(" ")
        else if (keyCode === RIME_KEY.enter) keyboard.insertText("\n")
        else if (keyCode >= 0x20 && keyCode <= 0x7e) keyboard.insertText(String.fromCharCode(keyCode))
      }
      return synchronize()
    },
    selectCandidate(index) {
      if (closed) return contextSnapshot(session)
      session.selectCandidateOnCurrentPage(index)
      return synchronize()
    },
    toggleAscii() {
      if (closed) return contextSnapshot(session)
      session.setOption("ascii_mode", !session.getOption("ascii_mode"))
      return synchronize()
    },
    commitComposition() {
      if (closed) return null
      const result = session.commitComposition()
      if (result?.text) keyboard.insertText(result.text)
      keyboard.unmarkText()
      return result?.text ?? null
    },
    clearComposition() {
      if (closed) return
      session.clearComposition()
      keyboard.unmarkText()
    },
    close() {
      if (closed) return
      closed = true
      session.close()
    },
  }
}

module.exports = { RIME_KEY, createRimeKeyboard }
