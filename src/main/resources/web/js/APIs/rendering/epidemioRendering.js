/**
 * Rendering on template Epidemio
 * 
 * @author : alban.gaignard@cnrs.fr
 */

/**
 * Given a JSON data specifying the value associated to a tag, returns the 
 * processed template with (Handlebars.js)
 * 
 * @param {type} hbTemplate
 * @param {type} contextData
 * @returns {unresolved}
 */
function processHbTemplate(hbTemplate, contextData) {
    var theTemplate = Handlebars.compile(hbTemplate);
    var theCompiledHtml = theTemplate(contextData);
    return theCompiledHtml;
}