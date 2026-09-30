// Deliberately untrusted frame at port 3000, attacking the approved port 5173.
// Both directions and detector control injection must be ignored by the adapter.
for (let i = 0; i < 20; i++) {
  top.postMessage({source:'server->proxy',payload:'malformed-iframe-rpc'},'http://127.0.0.1:5173')
  top.postMessage({source:'proxy->server',payload:'malformed-iframe-rpc'},'http://127.0.0.1:5173')
  top.postMessage({key:'__VUE_DEVTOOLS_VUE_DETECTED_EVENT__',data:{action:'safari:content-ready',vueDetected:true}},'http://127.0.0.1:5173')
}
document.querySelector('#result').textContent = 'Sent 60 cross-origin adversarial messages'
