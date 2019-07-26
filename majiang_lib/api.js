"use strict";
const logger = require("../log").logger;

exports.MTableMgr = require( './table_mgr.js' );
exports.MHulib = require( './hulib.js' );

exports.Init = function()
{
	logger.log("loading config.........");
    this.MTableMgr.Init();
    logger.log("config loaded!.");
};