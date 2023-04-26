// const {app, dialog, globalShortcut} = require('electron')
const {ipcMain} = require('electron')
const path = require('path')
var sudo = require('sudo-prompt');
// const { promisify } = require('util');
// const mkdirp = require('mkdirp');
const fs = require('fs');
const request = require('request');

const osType = require('os');


const dir  = osType.homedir() + '/.config/askos-support'


const dirPath = osType.homedir() + '/.config/askos-support/feedback';

var promptOptions = {
	name: 'Hamonikr'
//   ,icns: '/home/ryan/1.png', // (optional)
}; 


//==  로그파일 생성     ===================================================
//========================================================================
ipcMain.on('logFileTar', (event) => {
	logFileTarAsync(event);
});

const logFileTarAsync = async(event) => {
	try{
		var isCreateFolder = await createDirectory(dirPath);
		console.log("isCreateFolder=============+"+isCreateFolder);
		if( isCreateFolder == 'Y' ){
			var chkLicFileVal = await logFileTarProc();
			console.log("chkLicFileVal========++"+chkLicFileVal);
			event.sender.send('islogFileTarProc', chkLicFileVal );
		}else {
			console.log("error"); 
		}
	}catch(err){
		console.log("logFileTarAsync---" + err);
		// event.sender.send('isChkLicense', 'N', '','' );
		return Object.assign(err);
	}
}

// crate folder =============================
function createDirectory(directoryPath) {
	const directory = path.normalize(directoryPath);
	return new Promise((resolve, reject) => {
		fs.stat(directory, (error) => {
			if (error) {
				if (error.code === 'ENOENT') {
					fs.mkdir(directory, (error) => {
						if (error) {
								reject("N");
						} else {
								resolve("Y");
						}
					});
				} else {
					reject("N");
				}
			} else {
				resolve("Y");
			}
		}); 
	});
}


function logFileTarProc(){
	return new Promise(function(resolve, reject){

		var makeFolder = "";
		makeFolder += " sudo cp /var/log/syslog  " + dirPath +"/syslog.log";
		makeFolder += " &&  sudo cp /var/log/auth.log  " + dirPath ;
		makeFolder += " &&  sudo cp /var/log/boot.log  " + dirPath ;
		// makeFolder += " &&  sudo lshw -short -quiet > lshw.log  " + dirPath ;
		// makeFolder += " &&  sudo cat /proc/cpuinfo > lscpu.log  " + dirPath ;
		// makeFolder += " &&  sudo lscpu -all > lscpu.log  " + dirPath ;
		// makeFolder += " &&  sudo lsblk  > lsblk.log  " + dirPath ;
		// makeFolder += " &&  sudo lspci -v  > lspci.log  " + dirPath ;
		makeFolder += " &&  sudo cp /var/log/kern.log  " + dirPath ;
		makeFolder += " &&  dmesg  > " + dirPath +"/dmesg.log" ;
		makeFolder += " && sudo tar cvf " + dirPath +"/system_logfile.tar  " + dirPath +"/*.log";
		makeFolder += " && sudo chmod 777 " + dirPath +"/system_logfile.tar";
console.log("=========================makeFolder" + makeFolder);
		sudo.exec(makeFolder, promptOptions,
			function(error, stdout, stderr) {
				if (error) {
					console.log("error is " + error);
					return resolve("N");
				}else{
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					resolve("Y");
				}
			}
		);
	});
}


//== 문의 요청 전송 ===================================================
//====================================================================


const uploadproc = async(event) => {
	try{
		var osType = require('os');
		const  uploadURL = 'http://askos.co.kr/api/saveTchnlgyIngry?_csrf=${_csrf.token}';
		var filLocation =  osType.homedir()+"/.config/askos-support/feedback/system_logfile.tar";
		var filename = "system_logfile.tar";


		const formData = new form()
			// formData.append('file', stream, 'filename');
			formData.append('title', sub);
			formData.append('contents', '<p>' + cont+'</p>');
			formData.append('username', tsUser);
			formData.append('uuiduser', data);
			formData.append('section', 'Q');

			if( isChkBox ){
				formData.append('file1', fs.createReadStream(filLocation), {
					filename: filename,
					contentType: 'application/octet-stream',
					enctype: 'multipart/form-data'
				});
			}

			try {
				const res = await got.post('http://askos.co.kr/api/saveTchnlgyIngry?_csrf=${_csrf.token}', {
					body: formData,
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}).on('uploadProgress', progress => {
					// here we get our upload progress, progress.percent is a float number from 0 to 1
					console.log(Math.round(progress.percent * 100))
				});

				if (res.statusCode === 200) {
					// upload success
				} else {
					// error handler
				}
			} catch (e) {
				console.log(e);
			}
	}catch(err){
		console.log("logFileTarAsync---" + err);
		// event.sender.send('isChkLicense', 'N', '','' );
		return Object.assign(err);
	}
}

ipcMain.on('tchnlgyIngryProc', (event, sub, cont, tsUser, isChkBox) => {
	
	
	var osType = require('os');
	// var fileDir = osType.homedir() + '/.config/support/.hkrmesysinfo'
	const fileDir = osType.homedir() + '/.config/askos-support/userinfo_config'

	fs.readFile(fileDir, 'utf-8', (err, data) => {
		if(err){
			console.log("An error ocurred reading the file :" + err.message);
			return resolve("N");
		}else{


			var osType = require('os');
			const  uploadURL = 'http://askos.co.kr/api/saveTchnlgyIngry?_csrf=${_csrf.token}';
			var filLocation =  osType.homedir()+"/.config/askos-support/feedback/system_logfile.tar";
			var filename = "system_logfile.tar";

			var req = request.post(uploadURL, function (err, resp, body) {
				if (err) {
					console.log("request tech error is :"+ err);
				} else {
					var accountObj = JSON.parse(body);
					console.log("accountObj===========+++"+JSON.stringify(body));
					// 기술문의 등록후 첨부파일 삭제
					removeSystemLogFile();
					event.sender.send('isTchnlgyIngryProc', accountObj.message );
					console.log("accoun---" + accountObj.message );
				}
			});


			var form = req.form();
			form.append('title', sub);
			form.append('contents', '<p>' + cont+'</p>');
			form.append('username', tsUser);
			form.append('uuiduser', data);
			form.append('section', 'Q');

			if( isChkBox ){
				form.append('file1', fs.createReadStream(filLocation), {
					filename: filename,
					contentType: 'application/octet-stream',
					enctype: 'multipart/form-data'
				});
			}

		}
	});
});





var  rimraf = require("rimraf");
// 실행시 파일 삭제 (초기화)
removeSystemLogFile();

ipcMain.on('cancleSystemLogFile', (event) => {
        rimraf(dirPath, function () { console.log("done"); });
});


function removeSystemLogFile(){
        rimraf(dirPath, function () { console.log("done"); });
}
