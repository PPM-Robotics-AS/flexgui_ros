#!/usr/bin/python

import rospy
import re
import os
import rosapi

from pydoc import locate

from rospy_message_converter import message_converter
from rosapi.srv import MessageDetails, MessageDetailsResponse
from rosapi.msg import TypeDef
from flexgui_ros.srv import GetMessageTypes, GetMessageTypesResponse

# base ROS types
basetypes = ["bool",
             "int16","int64","int32","int8","uint16","uint64","uint32","uint8","time","duration",
             "float64","float16","float8","float32",
             "string"]

## Get all available message types
#
# @param data is the request object - GetMessageTypesRequest
def get_message_types(data):
    response = GetMessageTypesResponse()
    
    # create a temporary file 
    os.system('rosmsg list > tmp')
    for line in open('tmp', 'r').readlines():
        # read out the console's output from the temp file
        response.messages.append(line.rstrip())

    # return the list
    return response

## Get an example value for each base type
#
# @param type_name name of the type
def get_example(type_name):
    if type_name == "bool":
        return "True"

    if type_name in ["int16","int64","int32","int8","uint16","uint64","uint32","uint8","time","duration"]:
        return "0"

    if type_name in ["float64","float16","float8","float32"]:
        return "0.0"

    if type_name == "string":
        return ""

    if type_name == "array":
        return "[]"

    return "0"

## Recoursive function to create all of the type definitions presented in
# and object
#
# @param arr is the array for the type_defs 
# @param type_obj is and custom object 
# @param name is the name of the current type
def collect_typedefs(arr, type_obj, name):
    # create a new type def
    type_def = TypeDef()
    # set the name of the type
    type_def.type = name
    # add to the global list
    arr.append(type_def)

    # iterate through the params in the object
    for i in range(len(type_obj.__slots__)):
        # add each field
        type_def.fieldnames.append(type_obj.__slots__[i])
        type_name = type_obj._slot_types[i]
        # check if it is an array or not
        m = re.search('\[[0-9,]*\]', type_name)

        if m and len(m.group(0)) > 0:
            #array type
            if m.group(0) == "[]":
                # set the length to 0 if it is not defined
                type_def.fieldarraylen.append(0)
            else:
                # set the length (x) given between "[x]"
                type_def.fieldarraylen.append(int(re.search('[0-9]', m.group(0)).group(0)))

            # get an example for the array tpe
            type_def.examples.append(get_example("array"))
        else:
            # if not an array, set the length to -1
            type_def.fieldarraylen.append(-1)
            type_def.examples.append(get_example(type_name))

        # get the name of the type removing the array part
        type_name = re.sub('\[[0-9,]*\]', '', type_name)
        type_def.fieldtypes.append(type_name)

        # if the type_name is not a base type, go deeper
        if type_name not in basetypes:
            sub_type_obj = locate(type_name.replace("/", ".msg."))()
            collect_typedefs(arr, sub_type_obj, type_name)

    return arr
    
## Get service details handler
#
# @param data is the service request object - MessageDetailsRequest
def get_service_details(data):
    # get and object for the requested type
    request = locate(data.type.replace("/", ".srv.") + "Request")()

    # create the response object
    response = MessageDetailsResponse()

    # collect the details
    collect_typedefs(response.typedefs, request, data.type)

    return response

# init node
rospy.init_node("rosbridge_extension", anonymous=False)

# create the offered services
rospy.Service("get_service_details", MessageDetails, get_service_details)
rospy.Service("get_message_types", GetMessageTypes, get_message_types)

# listen
rospy.spin()
