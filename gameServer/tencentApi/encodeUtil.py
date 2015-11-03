#!/usr/bin/env python
# coding=utf-8

import urllib
from utilities import cclog
from encryptUtil import *

def x5_quote(s):
    """ 编码 URL, 根据 RFC 3986 规则在 quote 时, 忽略对 "~" 的转码

    python 的 urllib.quote 会对 "~" 进行编码，
    腾讯依据 "RFC 3986" 进行编码, 需要为第二个 safe 参数排除 "~" 的编码

    参考:
    RFC 3986 section 2.3
    unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"

    urllib.quote的官方注释如下:
    Replace special characters in string using the %xx escape.
    Letters, digits, and the characters '_.-' are never quoted.

    By default, this function is intended for quoting the path section of the URL.
    The optional safe parameter specifies additional characters that should not be quoted
    its default value is '/'

    :param s:
    :return:
    """
    result = urllib.quote(s, "~")
    cclog("URL Encode后:" + result)

    return result


def x5_unquote(s):
    """ 解码 url

    :param s:
    :return:
    """
    result = urllib.unquote(s)
    cclog("URL Decode后:" + result)

    return result



def x5_encode_url(prefix, data):
    """ 添加腾讯要求的前缀字段后，做URL编码

    PRICE_URL = ["GET", "/x5/price/", ""]
    PAY_URL   = ["GET", "/x5/pay/", ""]
    :param prefix:
    :param data:
    :return:
    """
    request_mode = prefix[0]
    request_path = prefix[1]

    if len(prefix[2]) > 0:
        request_arg = prefix[2] + "&data=" + data
    else:
        request_arg = "data=" + data

    result = x5_quote(request_mode) + "&" + x5_quote(request_path) + "&" + x5_quote(request_arg)
    cclog("加GET&/x5/xxx/&data=后:" + result)

    return result


def x5_encode_url_price(data):
    """ 添加"批价"前缀字段后，做URL编码

    :param data:
    :return:
    """
    return x5_encode_url(PRICE_URL, data)


def x5_encode_url_pay(data):
    """ 添加"发货"前缀字段后，做URL编码

    :param data:
    :return:
    """
    return x5_encode_url(PAY_URL, data)
