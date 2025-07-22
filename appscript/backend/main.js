function doGet(){
    return HtmlService.createTemplateFromFile('frontend/index')
        .evaluate()
        .setTitle('N2Apps')
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}