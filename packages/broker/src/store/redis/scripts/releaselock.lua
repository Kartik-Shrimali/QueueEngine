local instanceId = ARGV[1]

local storedId = redis.call('GET' , KEYS[1])

if storedId == instanceId then
    redis.call('DEL' , KEYS[1])
    return 1
else
    return 0
end