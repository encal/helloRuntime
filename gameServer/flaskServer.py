#!/usr/bin/env python
# coding=utf-8

from flask import Flask
from flask import request

from tencentApi import tencentApi
from gameApi import gameApi

app = Flask(__name__)

############## tencentApi #############

@app.route("/x5/price/", methods=['GET'])
def x5_price():
    return tencentApi.x5_price(request)

@app.route("/x5/pay/", methods=['GET'])
def x5_pay():
    return tencentApi.x5_pay(request)

@app.route("/x5/get_login_info", methods=['GET'])
def x5_get_login_info():
    return tencentApi.x5_get_login_info()

#######################################

############## gameApi ################
@app.route("/x5/save_user_info", methods=['GET'])
def x5_save_user_info():
    args = request.args

    qbopenid = args.get('qbopenid')
    nick_name = args.get('nickName')
    avatar_url = args.get('avatarUrl')

    return gameApi.save_user_info(qbopenid, nick_name, avatar_url)

@app.route("/get_user_list", methods=['GET'])
def get_user_list():
    return gameApi.get_user_list()


#######################################

# 脚本入口
if __name__ == "__main__":
    app.debug=True
    app.run('192.168.31.166', 5555)

