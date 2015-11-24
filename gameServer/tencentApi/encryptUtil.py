#!/usr/bin/env python
# coding=utf-8

############################### 请CP配置以下5个参数 ######################################
# 本例使用的 appkey, appid, transferKey 只是 runtime demo 用到的游戏参数
# cp需要自己替换为腾讯提供的值

#X5_APPID = "2466856218" # 腾讯提供的游戏唯一ID
#X5_APP_KEY = "PoltShYwh0uunguq" # [cp身份秘钥], 用于签名
#X5_TRANSFER_KEY = "vS99f24SlVeWmmrg" # [cp传输密钥], 用于加密解密传输的data数据

X5_APPID = "7497033494" # 腾讯提供的游戏唯一ID
X5_APP_KEY = "FVazPLJ7SoVsjWpD" # [cp身份秘钥], 用于签名
X5_TRANSFER_KEY = "UyzSYXsvxfmrttCL" # [cp传输密钥], 用于加密解密传输的data数据

# GET + 批价回调URL去掉前缀 + 链接本身参数
PRICE_URL = ["GET", "/x5/price/", ""]

# GET + 发货回调URL去掉前缀 + 链接本身参数
PAY_URL = ["GET", "/x5/pay/", ""]

# 举 http://xxx.com/x5/pay?action=inquiry 为例
# 第三个参数为 "action=inquiry", 否则第三个参数为 ""

########################################################################################


from utilities import cclog, to_hex_str
from Crypto.Cipher import AES
from encodeUtil import x5_quote, x5_unquote

from hashlib import sha1
import base64
import hmac

class X5AES():
    """ 腾讯加密解密 data 字段使用的算法

    """
    BLOCK_SIZE = 16 # AES 加密的块大小, 只能取值 16, 24, 32
    PADDING = '\x00' # 加密块的填充字符, 用于将加密文本填充至加密块大小的整数倍
    cipher = AES.new(X5_TRANSFER_KEY) # 使用腾讯提供的传输秘钥构建一个 AES 加密对象

    @staticmethod
    def pad(text):
        """ 使用填充字符 PADDING 将字符串 填充至块大小的整数倍

        :param text:
        :return:
        """
        return text + (X5AES.BLOCK_SIZE - len(text) % X5AES.BLOCK_SIZE) * X5AES.PADDING

    @staticmethod
    def encode(text):
        """ 先用 AES 加密数据, 再用 base64 编码

        :param text:
        :return:
        """
        cclog("AES加密前:" + text)

        cipher_text = X5AES.cipher.encrypt(X5AES.pad(text))
        cclog("AES加密后16进制:" + to_hex_str(cipher_text))

        base64_text = base64.b64encode(cipher_text)
        cclog("base64编码后:" + base64_text)

        return base64_text

    @staticmethod
    def decode(text):
        """ 先用 base64 解码, 再用 AES 解密数据

        :param text:
        :return:
        """
        cclog("AES解密前:" + text)

        cipher_text = base64.b64decode(text)
        cclog("base64解码后的16进制:" + to_hex_str(cipher_text))

        plain_text = X5AES.cipher.decrypt(cipher_text).rstrip(X5AES.PADDING)
        cclog("AES解密后:" + plain_text)

        return plain_text


def x5_hmac_base64(data):
    """ hmac-sha1 算法，根据 data 生成一个数据签名, 再用 base64 编码

    这里的 key 使用的是 "X5_APP_KEY&"
    :param data:
    :return:
    """
    signHash = hmac.new(X5_APP_KEY + "&", data, sha1).digest()
    sign = base64.b64encode(signHash)
    cclog("hmac_base64后:" + sign)

    return sign


def x5_encrypt(data):
    """ 加密数据, 用于发送响应给腾讯后台

    :param data:
    :return:
    """
    return x5_quote(X5AES.encode(data))


def x5_decrypt(data):
    """ 解密数据, 用于解析腾讯后台发来的参数

    :param data:
    :return:
    """
    return X5AES.decode(x5_unquote(data))
