/**
 * This file executes when the upload section on a workorder-page is opened.
 */

function sendFile(file, callback) {
  var formData = new FormData()
  var request = new XMLHttpRequest()
  var csrftoken = $("[name='csrfmiddlewaretoken']").val()

  formData.set('fil', file)
  formData.set('csrfmiddlewaretoken', csrftoken)
  request.open("POST", window.location.href)

  request.onreadystatechange = function() {//Call a function when the state changes.
    if(this.readyState == XMLHttpRequest.DONE && this.status == 200) {
      callback(file);
    }
  }

  request.send(formData)
}

function sendFileComplete() {
  location.reload();
}

/**
 * Converts the regular file-uploader to a multi-file-uploader.
 * Stolen from:
 * https://medium.com/typecode/a-strategy-for-handling-multiple-file-uploads-using-javascript-eb00a77e15f
 */
function prepMultiFile() {
  var fileInput = $('#id_fil').attr('multiple',true)[0]
  var fileCatcher = $('form')[1]
  var fileList =  []
  var uploadCheck = []
  fileInput.addEventListener('change', function(e){
    fileList = [];
    for (var i=0; i<fileInput.files.length;i++) {
      fileList.push(fileInput.files[i]);
    }
  })
  fileCatcher.addEventListener('submit', (e)=>{
    e.preventDefault()
    var $btn = $('input[type=submit]').last()
    var newbtn = $('<button>').html('Laster opp<span>.</span><span>.</span><span>.</span>').addClass('loading')
    $btn.replaceWith(newbtn)

    fileList.forEach((file)=>{
      sendFile(file, (f)=>{
        uploadCheck.push(f);
        if (uploadCheck.length == fileList.length) {
          console.log(uploadCheck,fileList)
          sendFileComplete();
        }
      })
    })
  })
}

$(function(){
  $('table').first().css({maxWidth:'650px'})
  prepMultiFile()
})