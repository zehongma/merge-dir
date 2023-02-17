#!/usr/bin/env node

const commander = require('commander');
const path = require('path');
const fex = require('fs-extra');
const pkg = require('../package.json');
const program = new commander.Command();

let cwd = process.cwd();


program.exitOverride((err) => {
  if (err.code === 'commander.missingArgument') {
    console.log('');
    program.outputHelp();
  }
  process.exit(err.exitCode);
});

let paths = []

async function mergeDir(folder,parent){
  const orinig = folder.replace(parent+'/','')
  if(!(await fex.exists(path.resolve(cwd,orinig)))){
    paths.push({
      type:'dir',
      to:path.resolve(cwd,orinig),
      from:path.resolve(parent,orinig),
      TargetExists: false
    })
    return false;
  }
  const dirs = await fex.readdir(folder)
  for(item in dirs){
    const url = path.resolve(folder,dirs[item])
    if((await fex.lstat(url)).isDirectory()){
      await mergeDir(url,parent)
    }else {
      await mergeFile(url,parent)
    }
  }
}
async function mergeFile(url,parent){
  const orinig = url.replace(parent+'/','')
  paths.push({
    type:'file',
    to:path.resolve(cwd,orinig),
    from:path.resolve(parent,orinig),
    TargetExists: await fex.exists(path.resolve(cwd,orinig))
  })
}

async function init(folder){
  const parent = path.resolve(folder,'./')
  const dirs = await fex.readdir(folder)
  for(item in dirs){
    const url = path.resolve(folder,dirs[item])
    if((await fex.lstat(url)).isDirectory()){
      await mergeDir(url,parent)
    }else {
      await mergeFile(url,parent)
    }
  }
}

program
  .version(pkg.version, '-v, --version')
  .arguments('[folder]')
  .description('Merge files for the current folder')
  .action(async (folder) => {
    if (typeof folder === 'undefined') {
      console.log('请提供需要合并的文件夹地址')
    }
    paths = []
    await init(folder)
    //统计差异
    const existenceNum = paths.reduce(function(total,curr){
      if(curr.TargetExists){
        return total +1;
      }
      return total
    },0)
    if(existenceNum/paths.length>0.5){
      paths.forEach(item=>{
        if(item.type ==='dir'){
          fex.copy(item.from,item.to)
          console.log('复制到：'+item.to)
        }else{
          fex.copy(item.from,item.to)
          console.log('复制到：'+item.to)
        }
      })
    }else{
      console.log('差异文件超过百分之50，不执行合并')
    }
  });

program.parse(process.argv);
