var express = require('express');
var router = express.Router();
const Chain = require("@alipay/mychain/index.node");
const fs = require("fs");
var mysql  = require('mysql');  
const solc = require('@alipay/solc');
const { Module } = require("module");
 
var AntChainApi = new Object();
var pool = mysql.createPool({     
  host     : 'localhost',       
  user     : 'root',              
  password : '123456',       
  port: '3306',                   
  database: 'antchain',
  connectionLimit:2000
}); 

const accountKey = fs.readFileSync("./src/user.pem", { encoding: "utf8" });
const accountPassword = "123abc";  //自定义的 user.pem 密码

const keyInfo = Chain.utils.getKeyInfo(accountKey, accountPassword);

const passphrase = "123abc"; //自定义的 client.key 密码

const contract = fs.readFileSync('./src/contract.sol', {encoding: 'ascii'});
const output = solc.compile(contract, 1);
const abi = JSON.parse(output.contracts[':AssetSample'].interface);
const bytecode = output.contracts[':AssetSample'].bytecode;

let opt = {
    host: '121.40.249.148',    //目标区块链网络节点的 IP
    port: 18130,          //端口号
    timeout: 30000,       //连接超时时间配置
    cert: fs.readFileSync("./src/client.crt", { encoding: "utf8" }),
    ca: fs.readFileSync("./src/ca.crt", { encoding: "utf8" }),
    key: fs.readFileSync("./src/client.key", { encoding: "utf8" }),
    userPublicKey: keyInfo.publicKey,
    userPrivateKey: keyInfo.privateKey,
    userRecoverPublicKey: keyInfo.publicKey,
    userRecoverPrivateKey: keyInfo.privateKey,
    passphrase: passphrase
}
const chain = Chain(opt)

/* GET users listing. */
router.post('/aaa', function(req, res, next) {
    pool.getConnection(function(err,conn){
        if(err){
            res.send({"code":400,"message":"数据库连接失败！"});
            res.end;
        }
        conn.release();
    })
   console.log("pri:",keyInfo.privateKey.toString('hex'));
   const a = Math.sqrt(req.body.contractName)
    res.send({"a":a});

});


router.post('/createAccount',async function(req,res,next){
    const newKey = Chain.utils.generateECKey();
    var username = 'user'+req.body.phoneNumber;
    chain.ctr.CreateAccount({
    from: 'test',
    to: username,
    data: {
        recover_key: '0x'+ newKey.publicKey.toString('hex'),
        auth_key: '0x'+ newKey.publicKey.toString('hex'),
        auth_weight: 100
    }
    }, (err, data) => {
        if(data.block_number != 0){
            pool.getConnection(function(err,conn){
                if(err){
                    res.send({"code":400,"message":"数据库连接失败！"});
                    conn.release();
                    res.end;
                }else{
                    var  sql = "insert into user (name,pubkey,prikey,phonenumber,userhash) values ('" + username + "','" + newKey.privateKey.toString('hex') + "','" + newKey.publicKey.toString('hex') + "','" + req.body.phoneNumber+"','" + Chain.utils.getHash(username) + "')";
                    console.log(sql);
                    conn.query(sql,function(err,result){
                        if(err){
                                console.log('[insert ERROR] - ',err.message);
                                res.send({"code":400,"message":"数据库操作失败！"});
                                res.end;
                        }else{
                            res.send({"code":200,"message":"账号创建成功！","TxHash":data.txhash});
                            res.end;
                        }
                    })
                }
                conn.release();
            })
        }else{
            console.log(data);
            res.send({"code":400,"message":"账号创建失败！","err":err});
            res.end;
        }
    })
})

router.post('/balanceOf',function(req,res,next){
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi); 
 
    var userName = 'user' + req.body.phoneNumber;
    myContract.balanceOf(Chain.utils.getHash(userName),{from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"查询失败！","data":err.output})
            res.end;
        }else{
            res.send({"code":200,"message":"查询成功！","data":output,"TxHash":data.txhash})
            res.end;
        }
    })
})

router.post('/getBaseURL',function(req,res,next){
    const contractName = req.body.contractName;
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi); 
 
    myContract.getBaseURL({from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"查询失败！","data":err.output})
            res.end
        }else{
            res.send({"code":200,"message":"查询成功！","data":output,"TxHash":data.txhash})
            res.end
        }
    })
    return;
})

router.post('/getName',function(req,res,next){
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi) 

    myContract.getName({from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"查询失败！","data":err.output})
            res.end
        }else{
            res.send({"code":200,"message":"查询成功！","data":output,"TxHash":data.txhash})
            res.end
        }
    })
})

router.post('/totalSupply',function(req,res,next){
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi) 

    myContract.totalSupply({from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"查询失败！","data":err.output})
            res.end
        }else{
            res.send({"code":200,"message":"查询成功！","data":output,"TxHash":data.txhash})
            res.end
        }
    })
})

router.post('/getTokenURL',function(req,res,next){
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi) 
 
    myContract.getTokenURL(req.body.tokenId,{from:'test'},(err,output,data)=>{
        if(err){
            console.log(data);
            res.send({"code":400,"message":"查询失败！","data":err.output,"TxHash":data.txhash})
            res.end
        }else{
            console.log(data);
            res.send({"code":200,"message":"查询成功！","data":output,"TxHash":data.txhash})
            res.end
        }
    })
})

router.post('/ownerOf',function(req,res,next){
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi) 

    myContract.ownerOf(req.body.tokenId,{from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"查询失败！","data":err.output,"TxHash":data.txhash})
            res.end
        }else{
            res.send({"code":200,"message":"查询成功！","data":output,"TxHash":data.txhash})
            res.end
        }
    })
})

router.post('/approve',function(req,res,next){
    pool.getConnection(function(err,conn){
        if(err){
            res.send({"code":400,"message":"数据库连接失败！","data":err});
            conn.release();
            res.end
        }else{
            let sql = "select * from user where phonenumber = '" + req.body.phoneNumber + "'";
            console.log(sql);
            conn.query(sql,function(err,result){
                if(err){
                    console.log('[SELECT ERROR] - ',err);
                    res.send({"code":400,"message":"数据库查询错误！","data":err})
                    conn.release();
                    res.end
                    }
                if(!result[0]){
                        res.send({"code":400,"message":"用户手机号不存在！","data":""})
                        res.end
                    }else{
                        opt.userPrivateKey = '0x' + result[0].pubkey,
                        opt.userPublicKey = '0x' + result[0].prikey,
                        opt.userRecoverPrivateKey = '0x' + result[0].pubkey,
                        opt.userRecoverPublicKey = '0x' + result[0].prikey,
                        chain.setUserKey(opt)
                        chain.setUserRecoverKey(opt)
                    
                        const contractName = req.body.contractName
                        // 初始化一个合约实例
                        let myContract = chain.ctr.contract(contractName, abi) 

                        var toUser = 'user' + req.body.toUser;
                        myContract.approve(Chain.utils.getHash(toUser),req.body.tokenId,{from:result[0].name},(err,output,data)=>{
                            if(err){
                                res.send({"code":400,"message":"approve失败！","data":err.output})
                                res.end
                            }else{
                                res.send({"code":200,"message":"approve成功！","data":output,"TxHash":data.txhash})
                                res.end
                            }
                        })
                        opt.userPrivateKey = keyInfo.privateKey
                        opt.userPublicKey = keyInfo.publicKey
                        opt.userRecoverPrivateKey = keyInfo.privateKey
                        opt.userRecoverPublicKey = keyInfo.publicKey
                        chain.setUserKey(opt)
                        chain.setUserRecoverKey(opt)
                    
                    }
            })
        }
        conn.release();
    })
})

router.post('/mint',function(req,res,next){
    pool.getConnection(function(err,conn){
        if(err){
            res.send({"code":400,"message":"数据库连接失败！","data":err})
            conn.release();
            res.end
        }else{
            const contractName = req.body.contractName
            // 初始化一个合约实例
            let myContract = chain.ctr.contract(contractName, abi) 

            var toUser = 'user' + req.body.toUser;
            myContract.mint(Chain.utils.getHash(toUser),req.body.value,{from:'test'},(err,output,data)=>{
                if(err){
                    res.send({"code":400,"message":"mint失败！","data":err.output})
                    res.end
                }else{
                    console.log(data.receipt.log_entry[1].log_data);
                    console.log(data.receipt.log_entry[1].log_data[1].toNumber());
                    console.log(data.receipt.log_entry[1].log_data[2].toNumber());
                    let tokenId = [];
                    for(i = 0;i<data.receipt.log_entry[1].log_data[1].toNumber();i++){
                        tokenId.push(data.receipt.log_entry[1].log_data[2].toNumber() - i)
                    }
                    res.send({"code":200,"message":"mint成功！","data":output,"tokenid":tokenId,"TxHash":data.txhash})
                    res.end
                }
            })
            
    }
})
})

router.post('/setBaseURL',function(req,res,next){
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi) 

    myContract.setBaseURL(req.body.baseURL,{from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"修改失败！","data":err.output})
        }else{
            console.log(data.txhash);
            res.send({"code":200,"message":"修改成功！","data":output,"TxHash":data.txhash})
            res.end
        }
    })
})
const contractId = 'c6ec36fb19cfdd8db7c998df1b9c69f021145777f84b19ec2d4d5c2f1309b696'

router.post('/transfer',function(req,res,next){
    pool.getConnection(function(err,conn){
        if(err){
            res.send({"code":400,"message":"数据库连接失败！","data":err})
            conn.release();
        }else{
            let sql = "select * from user where phonenumber = '" + req.body.phoneNumber + "'";
            console.log(sql);
            conn.query(sql,function(err,result){
                if(err){
                    console.log('[SELECT ERROR] - ',err);
                    res.send({"code":400,"message":"数据库查询错误！","data":err})
                    }
                    if(!result[0]){
                        res.send({"code":400,"message":"用户手机号不存在！","data":""})
                    }else{
                        opt.userPrivateKey = '0x' + result[0].pubkey,
                        opt.userPublicKey = '0x' + result[0].prikey,
                        opt.userRecoverPrivateKey = '0x' + result[0].pubkey,
                        opt.userRecoverPublicKey = '0x' + result[0].prikey,
                        chain.setUserKey(opt)
                        chain.setUserRecoverKey(opt)
                    
                        const contractName = req.body.contractName
                        // 初始化一个合约实例
                        let myContract = chain.ctr.contract(contractName, abi) 

                        var toUser = 'user' + req.body.toUser;

                        myContract.transfer(Chain.utils.getHash(toUser),req.body.tokenId,{from:result[0].name},(err,output,data)=>{
                            if(err){
                                res.send({"code":400,"message":"交易失败！","data":err.output,"TxHash":data.txhash})
                            }else{
                                console.log(data.receipt.log_entry);
                                res.send({"code":200,"message":"交易成功！","data":output,"TxHash":data.txhash})
                            }
                        })
                        opt.userPrivateKey = keyInfo.privateKey
                        opt.userPublicKey = keyInfo.publicKey
                        opt.userRecoverPrivateKey = keyInfo.privateKey
                        opt.userRecoverPublicKey = keyInfo.publicKey
                        chain.setUserKey(opt)
                        chain.setUserRecoverKey(opt)
                    }
            })
        }
   conn.release();
    })
})

router.post('/newContract', function(req, res, next) {
    const contractName = req.body.contractName
    // 初始化一个合约实例
    let myContract = chain.ctr.contract(contractName, abi) 
    // 部署合约，可传递初始化函数需要的参数
    myContract.new(bytecode,{
      from: 'test',
      // parameters: [param1, param2]
    }, (err, contract, data) => {
      if (err){
        res.send({"code":400,"message":"合约部署失败！","err_message":err})
        res.end
      }
    })

    myContract.setBaseURL(req.body.contractBaseURL,{from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"修改失败！","data":err.output})
            res.end
        }
    })
    
    myContract.setName(req.body.contractName,{from:'test'},(err,output,data)=>{
        if(err){
            res.send({"code":400,"message":"修改失败！","data":err.output})
            res.end
        }else{
            console.log(data.txhash);
            res.send({"code":200,"message":"合约部署成功!","data":output,"TxHash":data.txhash})
            res.end
        }
    })
});

router.post('/test', function(req, res, next) {
    // console.log(req.body.phoneNumber);
    pool.getConnection(function(err,conn){
        if(err){
            console.log(opt.userPrivateKey)
        }else{
            let sql = "select * from user";
            console.log(opt.userPrivateKey)
            res.send(sql);
            return;
            console.log("ssss");
            conn.query(sql,function(err,result){
                if(err){
                    res.send({"code":300,"message":"交易shibai"});
                }else{
                    res.send(result);
                    conn.release();
                }
            })
        }
        conn.release();
    })
});

module.exports = router;