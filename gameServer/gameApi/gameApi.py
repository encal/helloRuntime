#!/usr/bin/env python
# coding=utf-8

import pickle
import os
import json

def save_user_info():
    user_dict = {}
    if os.path.exists("user_info"):
        userdb  = open('user_info', 'r')
        user_dict = pickle.load(userdb)
        userdb.close()
    print "content is:", json.dumps(user_dict)

    if g_is_test is True:
        qbopenid = "adfjasdl;kfjal;sdkfjlakjdf"
        icon_url = "http://alalksdjflkjla"
        print user_dict.keys()

    user_dict[qbopenid] = {"icon_url":icon_url}
    userdb  = open('user_info', 'w')
    pickle.dump(user_dict, userdb)
    userdb.close()


if __name__ == "__main__":
    # unittest
    g_is_test = True
    save_user_info()