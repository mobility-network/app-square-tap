const btnConsentTrigger = document.getElementById("btn-consent-trigger");
const btnConsent = document.getElementById("btn-consent");
const tabCapture = document.getElementById("nav-capture-tab");
const tabAnalyze = document.getElementById("nav-analyze-tab");

btnConsent.onclick = function () {
    btnConsentTrigger.classList.remove('btn-danger');
    btnConsentTrigger.classList.add('btn-success');
    tabCapture.classList.remove('disabled');
    tabAnalyze.classList.remove('disabled');
}
