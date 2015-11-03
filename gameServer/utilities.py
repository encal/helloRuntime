#!/usr/bin/env python
# coding=utf-8

import random, string

def random_str(randomlength=15):
    """ 生成随机码，用于响应的nonce参数

    :param randomlength:
    :return:
    """
    alphabet = list(string.ascii_letters)
    random.shuffle(alphabet)
    return ''.join(alphabet[:randomlength])


def cclog(s):
    """ 日志打印辅助函数，多添加一个回车，方便查看与调试日志

    :param s:
    :return:
    """
    print "===>", s, "\n"


def assert_if_failed(conf, msg):
    """ 断言异常, 输出日志

    :param conf:
    :param msg:
    :return:
    """
    if not conf:
        cclog("ASSERT: " + msg)


def to_hex_str(s):
    """ 以16进制方式打印二进制流

    :param s:
    :return:
    """
    r = ("".join("{:02x}".format(ord(c)) for c in s))
    return r


