const {app, dialog, globalShortcut} = require('electron')
const {ipcMain} = require('electron')
const { promisify } = require('util');
const mkdirp = require('mkdirp');
// const mkDirpAsync = promisify(mkdirp);
const osType = require('os');
const dir  = osType.homedir() + '/.config/askos-support'
const fileDir  = osType.homedir() + '/.config/askos-support/userinfo_config';
const uniqid = require('uniqid');
const fs = require('fs');
const request = require('request');

//##################################################################
//로그인 성공 후 고유값 생성 후 파일로 저장 (자동로그인을 위해)
ipcMain.on('saveUserInfo', (event, usernm, comylocation, userid, seq) => {
	userInfoFileAsync(event, dir, usernm, comylocation, userid, seq);
})   

const userInfoFileAsync = async(event, dir, usernm, comylocation, userid, seq) => {
	event.preventDefault()
	const isExists = fs.existsSync( dir );
	console.log("isExists============++"+isExists)
    if( !isExists ) { 
        fs.mkdirSync( dir, { recursive: true } );
	}
	
	// const made = mkdirp.sync(dir);
	// console.log(`made directories, starting with ${made}`)

	// var makeDirpAsync = await mkDirpAsync(dir, { recursive: true, mode: 0o775 });
	// console.log("makeDirpAsync========++"+makeDirpAsync);

	var userUUIDVal = await userInfoWriteFile();
	console.log("userUUIDVal==========++"+userUUIDVal)
	var headersOpt = {"content-type": "application/json",};
	request({
		method:'POST',
		url:'http://askos.co.kr/api/userUUID?${_csrf.parameterName}=${_csrf.token}',
		// url:'http://localhost:8080/api/userUUID?${_csrf.parameterName}=${_csrf.token}',
		form: {'uuiduser':  userUUIDVal, 'userid' : userid},
		headers: headersOpt,
		json: true,
		}, async function (error, response, body) {
			if(!error){
				console.log("body============++"+body)
				event.sender.send('saveUserInfoProc', body, usernm, comylocation, userid, seq, userUUIDVal.trim());

				// const session = require('electron').session;
				// // Set a cookie with the given cookie data;  may overwrite equivalent cookies if they exist.
			  	// const cookie = { url: 'http://askos.co.kr', name:usernm, value: comylocation, cooName: usernm, cooComy: comylocation, cooUserid: userid, cooSeq: seq, cooUuid: userUUIDVal.trim()  }
			  	// session.defaultSession.cookies.set(cookie)
				// 	.then(() => {
				//   	// success
				//   	console.log("b=========================="+ JSON.stringify(cookie))
				// 	}, (error) => {
				//   	console.error(error)
				// })
				
			}else{
				event.sender.send('saveUserInfoProc', body, userUUIDVal.trim());
			}
		}
	);
}




function FnChk_settingsFile(){
	try{
		var retVal = fs.existsSync(fileDir);
		return retVal;
  	}catch(e){
		if(e.code == 'ENOENT'){
			return "false";
    	}
  	}
}


function userInfoWriteFile(){
	return new Promise(function(resolve, reject){
	  var arg = uniqid()+(new Date()).getTime().toString(36);
	  //fs.unlink(fileDir, (err) => err ?  console.log(err) : console.log(`${fileDir} 를 정상적으로 삭제했습니다!!!`));
	  fs.writeFile(fileDir, arg, (err) => {
		  if(err){
			reject("error");
		  }
		   resolve(arg);
		});
	});
}


