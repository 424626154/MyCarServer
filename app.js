var express = require('express');
var app = express();

var AppKey = '6bd5c3ffa52bca14090b62833e5bfc05';

var http = require('http');
var qs = require('querystring');

var mongoose = require('mongoose');
require('./models.js');
var CacheTime = mongoose.model('CacheTime');
var CarStatus = mongoose.model('CarStatus');
var CarCitys = mongoose.model('CarCitys');
var config = require('./config.json')
	//次数缓存时间
var statuscachetime = config.statuscache;
//城市缓存时间
var cityscachetime = config.cityscache;
//接口剩余请求次数查询
// 请求示例：http://v.juhe.cn/wz/status?key=xxxxxxx
// 请求参数说明：
// 名称	类型	必填	说明
//  	key	string	是	应用APPKEY(应用详细页查询)
//  	dtype	string	否	返回数据的格式,xml或json，默认json
// 返回参数说明：
// 名称	类型	说明
//  	error_code	int	返回码
//  	reason	string	返回说明
//  	data	-	返回结果集
//  	　　surplus	string	剩余次数
app.get('/wz/status', function(req, res) {
	CacheTime.find({}, function(err, docs) {
		if (err) {
			console.error("CacheTime.find err:", err)
		} else {
			// console.info('CacheTime.length', docs.length)
			if (docs.length > 0) {
				var cacheTime = docs[0];

				var curtime = Date.now();
				var cachetime = cacheTime.statustime;
				// console.info('curtime - cachetime < statuscachetime', curtime - cachetime < statuscachetime*1000)
				if (curtime - cachetime < statuscachetime * 1000) {
					// console.info('CarStatus')
					//查询缓存次数
					CarStatus.find({}, function(err, docs) {
							if (err) {
								console.error("CarStatus.find err:", err)
							} else {
								// console.info('CarStatus.length', docs.length)
								if (docs.length > 0) {
									var carStatus = docs[0];
									var resData = carStatus.resdata;
									res.json(JSON.parse(resData))
								} else {
									requestJHStatus(res);
								}
							}
						})
						//查询缓存次数
				} else {
					requestJHStatus(res);
				}
			} else {
				requestJHStatus(res);
			}
		}
	});
});
// 接口地址：http://v.juhe.cn/wz/citys
// 支持格式：json/xml/jsonp
// 请求方式：get post
// 请求示例：http://v.juhe.cn/wz/citys?key=key
// 接口备注：有些城市如果维护，我们会临时下线处理
// 调用样例及调试工具：API测试工具
// 请求参数说明：
// 名称	类型	必填	说明
//  	province	string	N	默认全部，省份简写，如：ZJ、JS
//  	dtype	string	N	返回数据格式：json或xml或jsonp,默认json
//  	format	int	N	格式选择1或2，默认1
//  	callback	String	N	返回格式选择jsonp时，必须传递
//  	key	string	Y	你申请的key
// 返回参数说明：
// 名称	类型	说明
//  	province_code	String	省份代码
//  	province	String	省份名称
//  	citys	Array	省份下开通城市数组
//  	city_code	String	城市代码
//  	city_name	String	城市名称
//  	engine	Int	是否需要发动机号0,不需要 1,需要
//  	engineno	Int	需要几位发动机号0,全部 1-9 ,需要发动机号后N位
//  	class	Int	是否需要车架号0,不需要 1,需要
//  	classa	Int	同上,（解决java中class关键字无法映射）
//  	classno	Int	需要几位车架号0,全部 1-9 需要车架号后N位
app.get('/wz/citys', function(req, res) {
	CacheTime.find({}, function(err, docs) {
		if (err) {
			console.error("CacheTime.find err:", err)
		} else {
			// console.info('CacheTime.length', docs.length)
			if (docs.length > 0) {
				var cacheTime = docs[0];

				var curtime = Date.now();
				var cachetime = cacheTime.citystime;
				// console.info('curtime - cachetime < cityscachetime', curtime - cachetime < cityscachetime * 1000)
				if (curtime - cachetime < cityscachetime * 1000) {
					// console.info('CarStatus')
					//查询缓存次数
					CarCitys.find({}, function(err, docs) {
							if (err) {
								console.error("CarCitys.find err:", err)
							} else {
								// console.info('CarCitys.length', docs.length)
								if (docs.length > 0) {
									var carCitys = docs[0];
									var resData = carCitys.resdata;
									res.json(JSON.parse(resData))
								} else {
									requestJHCitys(res);
								}
							}
						})
						//查询缓存次数
				} else {
					requestJHCitys(res);
				}
			} else {
				requestJHCitys(res);
			}
		}
	});
});
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});
//向聚合请求剩余次数
function requestJHStatus(res) {
	console.info('requestJHStatus');
	var http = require('http');
	var querystring = require('querystring');
	var path = '/wz/status?key=' + AppKey;
	var options = {
		host: 'v.juhe.cn', // 这个不用说了, 请求地址
		port: 80,
		path: path, // 具体路径, 必须以'/'开头, 是相对于host而言的
		method: 'GET', // 请求方式, 这里以post为例
		headers: { // 必选信息, 如果不知道哪些信息是必须的, 建议用抓包工具看一下, 都写上也无妨...
			'Content-Type': 'application/json'
		}
	};
	// console.inf("options:", options)
	http.get(options, function(hres) {
		var resData = "";
		hres.on("data", function(data) {
			resData += data;
		});
		hres.on("end", function() {
			// console.info(resData);
			var resJson = JSON.parse(resData)
				// console.info(resJson.resultcode);
			if (resJson.resultcode == 200) {
				saveStatus(resData)
			}
			res.json(resJson);
		});
	}).on('error', function(e) {　　
		console.error("Got error: " + e.message);　　
	});
}

//向聚合请求城市
function requestJHCitys(res) {
	console.info('requestJHStatus');
	var http = require('http');
	var querystring = require('querystring');
	var path = '/wz/citys?key=' + AppKey;
	var options = {
		host: 'v.juhe.cn', // 这个不用说了, 请求地址
		port: 80,
		path: path, // 具体路径, 必须以'/'开头, 是相对于host而言的
		method: 'GET', // 请求方式, 这里以post为例
		headers: { // 必选信息, 如果不知道哪些信息是必须的, 建议用抓包工具看一下, 都写上也无妨...
			'Content-Type': 'application/json'
		}
	};
	// console.inf("options:", options)
	http.get(options, function(hres) {
		var resData = "";
		hres.on("data", function(data) {
			resData += data;
		});
		hres.on("end", function() {
			// console.info(resData);
			var resJson = JSON.parse(resData)
				// console.info(resJson.resultcode);
			if (resJson.resultcode == 200) {
				saveCitys(resData)
			}
			res.json(resJson);
		});
	}).on('error', function(e) {　　
		console.error("Got error: " + e.message);　　
	});
}

//保存数据
function saveStatus(resData) {
	//缓存查询次数时间
	var cacheTime = new CacheTime({
		statustime: Date.now()
	});
	CacheTime.find({}, function(err, docs) {
		if (err) {
			console.error('err', err)
		} else {
			if (docs.length > 0) {
				console.info('docs[0]._id:', docs[0]._id)
				CacheTime.update({
					_id: docs[0]._id
				}, {
					$set: {
						statustime: cacheTime.statustime
					}
				}, function(err) {
					if (err) {
						console.error(err);
					} else {
						console.info('cacheTime update success', cacheTime)
					}
				})
			} else {
				cacheTime.save(function(err) {
					if (err) {
						console.error(err);
					} else {
						console.info('cacheTime save success', cacheTime)
					}
				});
			}
		}
	});
	//缓存查询次数数据
	var status = new CarStatus({
		resdata: resData
	})
	CarStatus.find({}, function(err, docs) {
		if (err) {
			console.error('err', err)
		} else {
			if (docs.length > 0) {
				CarStatus.update({
					_id: docs[0]._id
				}, {
					$set: {
						resdata: status.resdata
					}
				}, function(err) {
					if (err) {
						console.error(err);
					} else {
						console.info('cacheTime update success', cacheTime)
					}
				})
			} else {
				status.save(function(err) {
					if (err) {
						console.error('status save err:', err);
					} else {
						// console.info('status save success:', status)
					}
				});
			}
		}
	});
}

function saveCitys(resData) {
	//缓存查询次数时间
	var cacheTime = new CacheTime({
		citystime: Date.now()
	});
	CacheTime.find({}, function(err, docs) {
		if (err) {
			console.error('err', err)
		} else {
			if (docs.length > 0) {
				console.info('docs[0]._id:', docs[0]._id)
				CacheTime.update({
					_id: docs[0]._id
				}, {
					$set: {
						citystime: cacheTime.citystime
					}
				}, function(err) {
					if (err) {
						console.error(err);
					} else {
						console.info('cacheTime update success', cacheTime)
					}
				})
			} else {
				cacheTime.save(function(err) {
					if (err) {
						console.error(err);
					} else {
						console.info('cacheTime save success', cacheTime)
					}
				});
			}
		}
	});
	//缓存查询次数数据
	var citys = new CarCitys({
		resdata: resData
	})
	CarCitys.find({}, function(err, docs) {
		if (err) {
			console.error('err', err)
		} else {
			if (docs.length > 0) {
				CarCitys.update({
					_id: docs[0]._id
				}, {
					$set: {
						resdata: citys.resdata
					}
				}, function(err) {
					if (err) {
						console.error(err);
					} else {
						console.info('cacheTime update success', cacheTime)
					}
				})
			} else {
				citys.save(function(err) {
					if (err) {
						console.error('status save err:', err);
					} else {
						// console.info('status save success:', status)
					}
				});
			}
		}
	});
}