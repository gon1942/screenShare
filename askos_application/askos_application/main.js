require('update-electron-app')({
  logger: require('electron-log')
})

const path = require('path')
const glob = require('glob')
const { app, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')
const debug = /--debug/.test(process.argv[2])
const osModule = require("os");
const fs = require('fs');

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
var express = require('express');
var restApp = express();


restApp.get('/del/:model', function (req, res) {
  const filepath = '/tmp/data.json';

  fs.readFile(filepath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    let jsonArr;
    try {
      jsonArr = JSON.parse(data);
    } catch (err) {
      console.error(err);
      return;
    }
    jsonArr = jsonArr.filter(obj => obj.model !== req.params.model);
    const newData = JSON.stringify(jsonArr);
    console.log(newData)
    fs.writeFile(filepath, newData, 'utf8', err => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('File saved successfully.');
    });
  });

  res.send(["ok"]);
});


restApp.get('/test/:model/:ip/:nm', function (req, res) {
  console.log('test : http://127.0.0.1:8082/===============model===' + req.params.model);
  console.log('test : http://127.0.0.1:8082/===============ip===' + req.params.ip);
  console.log('test : http://127.0.0.1:8082/===============port===' + req.params.nm);

  // 파일이 있는 경우 파일 내용 가져오기
  var filepath = '/tmp/data.json';

  // 파일이 있는 경우 파일 내용 가져오기
  let jsonArr = [];
  if (fs.existsSync(filepath)) {
    const fileContent = fs.readFileSync(filepath, 'utf8');
    console.log("fileContent==========++" + fileContent)

    if (fileContent != '' && fileContent != null) {
      jsonArr = JSON.parse(fileContent);
    }
  }

  // 새로운 JSON object 생성
  const jsonObj = {
    model: req.params.model,
    ip: req.params.ip,
    port: req.params.port,
    usernm: req.params.nm
  };

  // JSON array 에 생성된 JSON object 추가
  // jsonArr.push(jsonObj);

  // JSON array 에 생성된 JSON object 추가 또는 업데이트
  let found = false;
  for (let i = 0; i < jsonArr.length; i++) {
    if (jsonArr[i].model === req.params.model) {
      jsonArr[i].ip = req.params.ip;
      jsonArr[i].port = req.params.port;
      found = true;
      break;
    }
  }
  if (!found) {
    jsonArr.push(jsonObj);
  }

  // 파일 저장
  writeFileSyncRecursive(filepath, JSON.stringify(jsonArr), 'utf8');

  // return "ok123";
  res.send([1, 2, 3]);
});
restApp.get("/api/users/user", (req, res) => {

  const user_id = req.query.user_id

  //filter라는 함수는 자바스크립트에서 배열 함수이다. 필터링을 할때 많이 사용된다 필터링한 데이터를 새로운 배열로 반환한다.
  
console.log(user_id)
  res.json({ok: true})
})


// fs.watch("/tmp/data.json", (eventType, filename) => {
//   console.log("\nThe file", filename, "was modified!");
//   console.log("The type of change was:", eventType);
// });

// Renaming the file to a new name



restApp.listen(3000, function () {
  console.log('test : http://127.0.0.1:8082/');
});

function writeFileSyncRecursive(filename, content, charset) {
  // normalize path separator to '/' instead of path.sep, 
  // as / works in node for Windows as well, and mixed \\ and / can appear in the path
  let filepath = filename.replace(/\\/g, '/');

  // preparation to allow absolute paths as well
  // let root = '';
  let root = '/tmp/';
  if (filepath[0] === '/') {
    root = '/';
    filepath = filepath.slice(1);
  }
  else if (filepath[1] === ':') {
    root = filepath.slice(0, 3);   // c:\
    filepath = filepath.slice(3);
  }

  // create folders all the way down
  const folders = filepath.split('/').slice(0, -1);  // remove last item, file
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + '/';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      return folderPath
    },
    root // first 'acc', important
  );

  // write file
  fs.writeFileSync(root + filepath, content, {
    encoding: charset
  });
}

function appendFileSyncJson(filename, content) {
  const filepath = filename.replace(/\.[^/.]+$/, "") + ".json"; // change file extension to .json
  let data = [];

  try {
    // read file and parse JSON data
    const fileContent = fs.readFileSync(filepath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (err) {
    // ignore file not found error
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  // append new content to existing data
  data.push(content);

  // write file with updated data
  const jsonContent = JSON.stringify(data);
  writeFileSyncRecursive(filepath, jsonContent, 'utf8');
}

// function writeFileSyncRecursive(filename, content, charset) {
//   // -- normalize path separator to '/' instead of path.sep, 
//   // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
//   let filepath = filename.replace(/\\/g,'/');  

//   // -- preparation to allow absolute paths as well
//   // let root = '';
//   let root = '/tmp/';
//   if (filepath[0] === '/') { 
//     root = '/'; 
//     filepath = filepath.slice(1);
//   } 
//   else if (filepath[1] === ':') { 
//     root = filepath.slice(0,3);   // c:\
//     filepath = filepath.slice(3); 
//   }

//   // -- create folders all the way down
//   const folders = filepath.split('/').slice(0, -1);  // remove last item, file
//   folders.reduce(
//     (acc, folder) => {
//       const folderPath = acc + folder + '/';
//       if (!fs.existsSync(folderPath)) {
//         fs.mkdirSync(folderPath);
//       }
//       return folderPath
//     },
//     root // first 'acc', important
//   ); 

//   // -- write file
//   // fs.writeFileSync(root + filepath, content, charset);
//   // write file
//   fs.writeFileSync(root + filepath, content, {
//     encoding: charset,
//     flag: 'a'
//   });
// }

//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


if (process.mas) app.setName('Electron APIs')

let mainWindow = null


const session = require('electron').session;




function initialize() {
  makeSingleInstance()

  loadDemos()
  function createWindow() {

    var ses = session.fromPartition('persist:name');

    const windowOptions = {
      width: 1080,
      minWidth: 680,
      height: 840,
      title: app.getName(),
      webPreferences: {
        defaultEncoding: 'utf8',
        defaultFontFamily: 'cursive',
        focusable: true,
        webviewTag: true,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        nodeIntegrationInSubFrames: true,
        sandbox: false,
        webgl: true,
        nativeWindowOpen: true,
        ses
      }
    }



    if (process.platform === 'linux') {
      windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/512.png')
    }

    mainWindow = new BrowserWindow(windowOptions)
    console.log('__dirname---' + __dirname);
    mainWindow.loadURL(path.join('file://', __dirname, 'index.html'))

    // Launch fullscreen with DevTools open, usage: npm run debug
    mainWindow.webContents.openDevTools()
    if (debug) {
      mainWindow.webContents.openDevTools()
      mainWindow.maximize()
      require('devtron').install()
    }

    console.log("ses---" + ses.getUserAgent())
    mainWindow.on('closed', () => {
      mainWindow = null
    })

    mainWindow.webContents.on('did-finish-load', () => {
      // then close the loading screen window and show the main window
      if (loadingScreen) {
        loadingScreen.close();
      }
      mainWindow.show();
    });



    // const session = require('electron').session;
    // const currentSession = session.fromPartition('persist:someName').cookies;

    // const ses = mainWindow.webContents.session
    // console.log("ses==================++>" + ses.getUserAgent())


    // currentSession.get({}, function(error, cookies) {
    //   console.dir(cookies);
    //   if (error) {
    //       console.dir(error);
    //   }
    // });
  }

  app.on('ready', () => {
    //createWindow()
    createLoadingScreen();
    setTimeout(() => {
      createWindow();
    }, 2000);
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

// Make this app a single instance app.
//
// The main window will be restored and focused instead of a second window
// opened when a person attempts to launch a second instance.
//
// Returns true if the current version of the app should quit instead of
// launching.
function makeSingleInstance() {
  if (process.mas) return

  app.requestSingleInstanceLock()

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Require each JS file in the main-process dir
function loadDemos() {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach((file) => { require(file) })
}

let loadingScreen;
const createLoadingScreen = () => {
  /// create a browser window
  loadingScreen = new BrowserWindow(
    Object.assign({
      /// define width and height for the window
      width: 200,
      height: 200,
      /// remove the window frame, so it will become a frameless window
      frame: false,
      /// and set the transparency, to remove any window background color
      transparent: true
    })
  );
  loadingScreen.setResizable(false);
  loadingScreen.loadURL(
    'file://' + __dirname + '/landing.html'
  );
  loadingScreen.on('closed', () => (loadingScreen = null));
  loadingScreen.webContents.on('did-finish-load', () => {
    loadingScreen.show();
  });
};


ipcMain.on('getSession', (event, usernm, userpw) => {
  session.defaultSession.cookies.get({})
    .then((cookies) => {
      // console.log("all cookies ==="+ JSON.stringify(cookies))
    }).catch((error) => {
      console.log(error)
    })

  // Query all cookies associated with a specific url.
  session.defaultSession.cookies.get({ url: 'http://askos.co.kr' })
    .then((cookies) => {
      // console.log("a==============aaaaaaaaaaaaaaaaaaaa============"+ JSON.stringify(cookies))
    }).catch((error) => {
      console.log(error)
    })
})


function systeminfo_val() {
  var systemVal = "";
  systemVal += "echo   \"-------------------------------System Information----------------------------\"";
  systemVal += "&& echo   \"Hostname:\t\t\"`hostname`";
  systemVal += "&& echo  \"uptime:\t\t\t\"`uptime | awk '{print $3,$4}' | sed 's/,//'`";
  systemVal += "&& echo  \"Manufacturer:\t\t\"`cat /sys/class/dmi/id/chassis_vendor`";
  systemVal += "&& echo   \"Product Name:\t\t\"`cat /sys/class/dmi/id/product_name`";
  systemVal += "&& echo   \"Version:\t\t\"`cat /sys/class/dmi/id/product_version`";
  systemVal += "&& echo   \"Machine Type:\t\t\"`vserver=$(lscpu | grep Hypervisor | wc -l); if [ $vserver -gt 0 ]; then  \"VM\"; else  \"Physical\"; fi`";
  systemVal += "&& echo   \"Operating System:\t\"`hostnamectl | grep \"Operating System\" | cut -d ' ' -f5-`";
  systemVal += "&& echo   \"Kernel:\t\t\t\"`uname -r`";
  systemVal += "&& echo   \"Architecture:\t\t\"`arch`";
  systemVal += "&& echo   \"Processor Name:\t\t\"`awk -F':' '/^model name/ {print $2}' /proc/cpuinfo | uniq | sed -e 's/^[ \t]*//'`";
  systemVal += "&& echo   \"Active User:\t\t\"`w | cut -d ' ' -f1 | grep -v USER | xargs -n1`";
  systemVal += "&& echo   \"System Main IP:\t\t\"`hostname -I`";
  systemVal += "&& echo  \"\"";
  systemVal += "&& echo   \"-------------------------------CPU/Memory Usage------------------------------\"";
  systemVal += "&& echo   \"Memory Usage:\t\"`free | awk '/Mem/{printf(\"%.2f%\"), $3/$2*100}'`";
  systemVal += "&& echo   \"Swap Usage:\t\"`free | awk '/Swap/{printf(\"%.2f%\"), $3/$2*100}'`";
  systemVal += "&& echo   \"CPU Usage:\t\"`cat /proc/stat | awk '/cpu/{printf(\"%.2f%\"), ($2+$4)*100/($2+$4+$5)}' |  awk '{print $0}' | head -1`";
  systemVal += "&& echo  \"\"";
  systemVal += "&& echo  \"-------------------------------Disk Usage-------------------------------\"";
  systemVal += "&& echo  df -Ph | sed s/%//g | awk '{ if($5 > 10) print $0;}'";
  // systemVal +="&& echo df -Ph | sed s/%//g | awk '{ if($5 > 80) print $0;}'";
  systemVal += "&& echo  \"\"";
  return systemVal;

}


const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function systemInfo() {
  var shellCommande = systeminfo_val();
  // var shellCommande = "HOSTNAME=$(hostname) ";
  // console.log("shellCommande===="+ shellCommande);
  const { stdout, stderr } = await exec(shellCommande);

  if (stderr) {
    console.error(`error: ${stderr}`);
  }
  console.log(`result :::  ${stdout}`);

}



const si = require('systeminformation');


// // define all values, you want to get back
// valueObject = {
//   // cpu: 'manufacturer, brand, speed, cores',
//   cpu: '*',
//   osInfo: 'platform, distro, release, codename, kernal, arch, hostname',
//   system: 'model, manufacturer, version, serial, uuid, sku, virtual, raspberry',
//   bios: '*'
// }
// si.get(valueObject).then(data => console.log(data));


// get system info  ===========================================



const sysInfo = async (event) => {
  let retData = {}

  const interfaces = osModule.networkInterfaces();

  // 로컬 IP 정보 가져오기
  let localIP = '';
  Object.keys(interfaces).forEach((interfaceName) => {
    const interfaceInfo = interfaces[interfaceName];
    interfaceInfo.forEach((info) => {
      if (info.family === 'IPv4' && !info.internal) {
        localIP = info.address;
      }
    });
  });

  // console.log(`로컬 IP: ${localIP}`);


  const cpu = await si.cpu(); // CPU Info
  // console.log("=======cpu===" + JSON.stringify(cpu));

  // console.log("cpuid===" + JSON.stringify(osModule.cpus()));


  let cpuinfo = ` ${cpu.manufacturer} ${cpu.brand} ${cpu.speed}GHz`;
  cpuinfo += ` ${cpu.cores} (${cpu.physicalCores} Physical)`;


  const disk = (await si.diskLayout())[0]; // Disk Info
  const size = Math.round(disk.size / 1024 / 1024 / 1024);
  let diskInfo = ` ${disk.vendor} ${disk.name} ${size}GB ${disk.type} (${disk.interfaceType})`;

  const os = await si.osInfo(); //OS Info
  let osinfo = ` ${os.distro} ${os.release} ${os.codename} (${os.platform})`;

  let osinfoKernel = ` ${os.kernel} ${os.arch}`;

  const ram = await si.mem(); // RAM Info
  const totalRam = Math.round(ram.total / 1024 / 1024 / 1024);
  let raminfo = ` ${totalRam}GB`;

  var bytesAvailable = osModule.totalmem(); // returns number in bytes // 1 mb = 1048576 bytes
  // console.log("1===================++"+ bytesAvailable)
  let bytesAvailinfo = "Total memory available MB :" + (bytesAvailable / 1048576) + "";
  // console.log("2===================++"+ bytesAvailinfo)

  var mbTotal = ((osModule.totalmem()) / 1048576);
  var mbFree = ((osModule.freemem()) / 1048576);
  let mbinfo = "There are " + mbFree + "mb free in the memory of " + mbTotal + "mb in total";

  // const versions = await si.versions(); // Node Info
  // let nodeinfo = `Node: v${versions.node}`;
  // nodeinfo += `V8: ${versions.v8}`;

  retData = {
    cpuinfo: cpuinfo,
    diskInfo: diskInfo,
    osinfo: osinfo,
    osinfoKernel: osinfoKernel,
    raminfo: raminfo,
    bytesAvailinfo: bytesAvailinfo,
    mbinfo: mbinfo,
    mbFree: mbFree,
    mbTotal: mbTotal,
    localIP: localIP
  }

  event.sender.send('getSystemInfoProc', retData);

}


ipcMain.on('getSystemInfo', (event) => {
  sysInfo(event);
});

ipcMain.on('getLocalIp', (event) => {
  const interfaces = osModule.networkInterfaces();

  // 로컬 IP 정보 가져오기
  let localIP = '';
  Object.keys(interfaces).forEach((interfaceName) => {
    const interfaceInfo = interfaces[interfaceName];
    interfaceInfo.forEach((info) => {
      if (info.family === 'IPv4' && !info.internal) {
        localIP = info.address;
      }
    });
  });

  console.log(`------->로컬 IP: ${localIP}`);
  event.sender.send('getLocalIpProc', localIP);
});




ipcMain.on('initApp', (event, path) => {
  console.log("bbbbbbbbb");
  const fs = require('fs');
  const request = require('request');


  var userUuidStr = "";
  let fileDir = osModule.homedir() + '/.config/askos-support/userinfo_config';
  console.log("fileDir==========++" + fileDir);

  try {
    console.log("cccccccccc")
    var retVal = fs.existsSync(fileDir);
    console.log("retVal==========++" + retVal)
    if (retVal) {
      userUuidStr = fs.readFileSync(fileDir, 'utf8');
      console.log("userUuidStr=========" + userUuidStr.trim() + "===");

      var headersOpt = {
        "content-type": "application/json",
      };
      request({
        method: 'post',
        url: 'http://askos.co.kr/api/getUserInfo',
        // url:'http://localhost:8080/api/getUserInfo',
        form: { 'uuiduser': userUuidStr.trim() },
        headers: headersOpt,
        json: true,
      }, async function (error, response, body) {
        console.log("getUserInfo --------------err===" + error);
        if (!error) {
          console.log("getUserInfo--------------ret body===" + JSON.stringify(body) + "==+" + userUuidStr.trim());
          console.log("body.output=========+++" + body.output)
          if (body.output == "Y") {
            console.log("111111111111")
            event.sender.send('initAppProc', body, userUuidStr.trim());
          } else {
            console.log("222222222222")
            event.sender.send('initAppProc', body, userUuidStr.trim());
          }
        } else {
          console.log("getUserInfo --------------err=" + error);
        }
      }
      );
    }
  } catch (e) {
    if (e.code == 'ENOENT') {
      console.log("//==mkdir directory");
      userUuidStr = "none";
    }
  }
});


initialize()


