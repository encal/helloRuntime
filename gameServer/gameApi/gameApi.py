#!/usr/bin/env python
# coding=utf-8

import pickle
import os
import json

'''
user_dict = {
    "user_id":{
        "nick_name":str,
        "avatar_url":str,
        "score":int,
        "gold":int,
    },
    ...
}
'''

def get_user_list():
    user_dict = {}

    # 从 user_info 数据库中获得 user_dict
    if os.path.exists("user_info"):
        user_db  = open('user_info', 'r')
        user_dict = pickle.load(user_db)
        user_db.close()

    # print "content is:", json.dumps(user_dict, indent=4)
    return json.dumps(user_dict)


def save_user_info(qbopenid, nick_name, avatar_url):
    user_dict = {}

    # 从 user_info 数据库中获得 user_dict
    if os.path.exists("user_info"):
        user_db  = open('user_info', 'r')
        user_dict = pickle.load(user_db)
        user_db.close()

    # 保存用户数据
    if user_dict.has_key(qbopenid):
        user_dict[qbopenid]["nick_name"] = nick_name
        user_dict[qbopenid]["avatar_url"] = avatar_url
    else:
        user_dict[qbopenid] = {
            "nick_name":nick_name,
            "avatar_url":avatar_url,
            "score":0,
            "gold":0
        }

    user_db  = open('user_info', 'w')
    pickle.dump(user_dict, user_db)
    user_db.close()
    return "success"


if __name__ == "__main__":
    # unittest
    g_is_test = True
    save_user_info("admin", "stevejokes", "beautiful")
