#!/usr/bin/env python
# coding=utf-8

from utilities import random_str, cclog, assert_if_failed
from encryptUtil import X5_APPID
from encryptUtil import x5_hmac_base64, x5_encrypt, x5_decrypt
from encodeUtil import x5_encode_url_pay, x5_encode_url_price, x5_quote, x5_unquote

import time
import json

############ sign #############

def x5_data_signature(data):
    """ 根据 x5 规则, 获得数据的数字签名

    :param data:
    :return:
    """
    cclog("x5_sign_appsigdata, 原数据:" + data)
    return x5_quote(x5_hmac_base64(data))


def x5_sign_price_data(data):
    """ 批价回调里用的签名函数

    :param data:
    :return:
    """
    cclog("原数据:" + data)
    data = x5_encode_url_price(data)
    return x5_data_signature(data)


def x5_sign_pay_data(data):
    """ 发货回调里用的签名函数

    :param data:
    :return:
    """
    cclog("原数据:" + data)
    data = x5_encode_url_pay(data)
    return x5_data_signature(data)


def x5_is_correct_of_price_sign(data, sign):
    """ 检测批价的签名是否正确

    :param data:
    :param sign:
    :return:
    """
    calc_sign = x5_sign_price_data(data)
    cclog("正确的:" + sign)
    cclog("计算的:" + calc_sign)
    ret = True if sign == calc_sign else False
    if ret:
        cclog("签名验证成功!")
    else:
        cclog("签名验证失败!")
    return ret


def x5_is_correct_of_pay_sign(data, sign):
    """ 检测发货的签名是否正确

    :param data:
    :param sign:
    :return:
    """
    calc_sign = x5_sign_pay_data(data)
    cclog("正确的:" + sign)
    cclog("计算的:" + calc_sign)
    ret = True if sign == calc_sign else False
    if ret:
        cclog("签名验证成功!")
    else:
        cclog("签名验证失败!")
    return ret


def x5_get_login_info():
    """ 返回游戏用于登录的签名等参数

    :return:
    """
    cur_time = int(time.time())
    nonce = random_str(15)

    encrypted_data = x5_encrypt(X5_APPID + "_" + str(cur_time) + "_" + nonce)

    param = {
        "appid": X5_APPID,
        "appsigdata": encrypted_data,
        "appsig": x5_data_signature(encrypted_data)
    }
    return json.dumps(param)

################################


def x5_get_decoded_args(data):
    """ 获取回调函数的参数，返回dict

    :param data:
    :return:
    """

    cclog("正在参数解码...")
    cclog("原数据:" + data)

    arg_map = {}
    decrypted_data = x5_decrypt(data)
    arg_list = decrypted_data.split("&")
    for arg in arg_list:
        pair = arg.split("=", 1)
        if len(pair) != 2:
            cclog("ERROR: pair size is wrong, it needs to be 2 while now is " + str(len(pair)) + "!")
            cclog("ERROR: arg:" + str(arg) + ",pair:" + str(pair))
            return None
        arg_map[pair[0]] = pair[1]
    return arg_map

def x5_price_response(obj):
    """ 生成批价响应数据，返回json格式

    :param obj:
    :return:
    """
    data = json.dumps(obj)

    if g_is_test is True:
        # 用此测试数据返回的结果为: 批价响应数据:{"rspsig": "eZR%2BhSmVn07Ysswa6GyMM%2FWjrI8%3D", "data": "pwSvgzN0vJieacYw7z8SBLP8INLmWY%2Bq2o74E0%2BBEAYi5OhHMq9Ndo5c1EEa9RBHpzjxGKRsbfIt10acMiT%2Bv7k1VoEukIaJPa1T49R0KN54oRW436bHJl%2BSsngqvSuC"}
        data = "{\"msg\": \"success\", \"nonce\": \"NphsHyYDljzEVLn\", \"time\": 1430404481, \"ret\": 0, \"payamount\": 10}"

    cclog("==> obj: " + data)
    data = x5_encrypt(data)
    sign = x5_sign_price_data(data)

    ret = {
        "data": data,
        "rspsig": sign
    }
    ret = json.dumps(ret)
    cclog("批价响应数据:" + ret)
    return ret

def x5_pay_response(obj):
    """ 生成发货响应数据，返回json格式

    :param obj:
    :return:
    """
    data = json.dumps(obj)
    cclog("==> obj: " + data)
    data = x5_encrypt(data)
    sign = x5_sign_pay_data(data)

    ret = {
        "data": data,
        "rspsig": sign
    }
    ret = json.dumps(ret)
    cclog("发货响应数据:" + ret)
    return ret


######## functional api ########

def x5_price(request):
    cclog("批价回调接口被调用了...")

    data = None
    reqsig = None

    if request is not None:
        data = x5_quote(request.args.get("data"))
        reqsig = x5_quote(request.args.get("reqsig"))

    if g_is_test is True:
        data = "K0hNxW046polkGzuQ4j7JLOyH%2B2SkMQvuEZ28ny11SFgTjQkmWhjX9AHN0nbPD0WxB8Zkj14%2B2yIXEkcp4%2FdGKT5gaImDUUIXDkF7WVVQragsQALRTrx0z0wdkQiqkVFdokPtBpJcotIeAZBl1r1SEHxAPLvLbGeKnJxjJawK98tFMxhtaCspaPfTlLXbd3Sfi436fr%2BupHmNtiHw2NfE%2FKiKtj2zkz8k1pV4oLf%2Fs1m5dEJa2d2b2m%2FQ4scYPGFyM4eMPeOHHqtpUDS2zSYoA%3D%3D"
        reqsig = "GSOnCNbncMK9ySNTx5cfVkNAwoU%3D"

    cclog("args: data=" + data)
    cclog("args: reqsig=" + reqsig)

    ret = {
        "payamount": 10,
        "ret": 0,
        "msg": "success",
        "time": int(time.time()),
        "nonce": random_str(15)
    }

    if x5_is_correct_of_price_sign(data, reqsig):
        args = x5_get_decoded_args(data)
        if args is None:
            ret["ret"] = -2
            ret["msg"] = "failure: Parse arguments failed!"
        else:
            # 判断参数正确性
            assert_if_failed("qbopenid" in args, "'qbopenid' wasn't in arguments")
            assert_if_failed("payitem" in args, "'payitem' wasn't in arguments")
            assert_if_failed("payinfo" in args, "'payinfo' wasn't in arguments")
            assert_if_failed("custommeta" in args, "'custommeta' wasn't in arguments")
            assert_if_failed("time" in args, "'time' wasn't in arguments")
            assert_if_failed("nonce" in args, "'nonce' wasn't in arguments")
            # TODO: CP在这根据腾讯后台发来的字段，填写自己的后台逻辑
    else:
        cclog("ERROR(Price): The sign wasn't correct when checking signing!")
        ret["ret"] = -1
        ret["msg"] = "failure: sign wasn't correct!"

    response = x5_price_response(ret)
    return response

def x5_pay(request):
    cclog("发货回调接口被调用了...")

    data = x5_quote(request.args.get("data"))
    cclog("args: data=" + str(data))
    reqsig = x5_quote(request.args.get("reqsig"))
    cclog("args: reqsig=" + reqsig)

    ret = {
        "ret": 0,
        "time": int(time.time()),
        "nonce": random_str(15)
    }

    is_sign_correct = x5_is_correct_of_pay_sign(data, reqsig)
    if is_sign_correct:
        args = x5_get_decoded_args(data)
        if args is None:
            ret["ret"] = -2
        else:
            # 判断参数正确性
            assert_if_failed("orderno" in args, "'orderno' wasn't in arguments")
            assert_if_failed("qbopenid" in args, "'qbopenid' wasn't in arguments")
            assert_if_failed("payitem" in args, "'payitem' wasn't in arguments")
            assert_if_failed("payamount" in args, "'payamount' wasn't in arguments")
            assert_if_failed("custommeta" in args, "'custommeta' wasn't in arguments")
            assert_if_failed("time" in args, "'time' wasn't in arguments")
            assert_if_failed("nonce" in args, "'nonce' wasn't in arguments")
            # TODO: CP在这根据腾讯后台发来的字段，填写自己的后台逻辑
    else:
        cclog("ERROR(Pay): The sign wasn't correct when checking signing!")
        ret["ret"] = -1

    response = x5_pay_response(ret)
    return response


if __name__ == "__main__":
    # unittest
    g_is_test = True

    # 验证批价回调
    x5_price(None)

    #
    # x5_unquote(x5_quote(" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}~\n\b\t\f\r111"))

    # 执行此函数, 验证签名算法实现是否成功
    # x5_is_correct_of_price_sign("K0hNxW046polkGzuQ4j7JLOyH%2B2SkMQvuEZ28ny11SFgTjQkmWhjX9AHN0nbPD0WxB8Zkj14%2B2yIXEkcp4%2FdGKT5gaImDUUIXDkF7WVVQragsQALRTrx0z0wdkQiqkVFdokPtBpJcotIeAZBl1r1SEHxAPLvLbGeKnJxjJawK98tFMxhtaCspaPfTlLXbd3Sfi436fr%2BupHmNtiHw2NfE%2FKiKtj2zkz8k1pV4oLf%2Fs1m5dEJa2d2b2m%2FQ4scYPGFyM4eMPeOHHqtpUDS2zSYoA%3D%3D", "GSOnCNbncMK9ySNTx5cfVkNAwoU%3D")

    #
    # args = x5_get_decoded_args("K0hNxW046polkGzuQ4j7JLOyH%2B2SkMQvuEZ28ny11SFgTjQkmWhjX9AHN0nbPD0WxB8Zkj14%2B2yIXEkcp4%2FdGKT5gaImDUUIXDkF7WVVQragsQALRTrx0z0wdkQiqkVFdokPtBpJcotIeAZBl1r1SEHxAPLvLbGeKnJxjJawK98tFMxhtaCspaPfTlLXbd3Sfi436fr%2BupHmNtiHw2NfE%2FKiKtj2zkz8k1pV4oLf%2Fs1m5dEJa2d2b2m%2FQ4scYPGFyM4eMPeOHHqtpUDS2zSYoA%3D%3D")

    pass
