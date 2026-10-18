local instanceId = ARGV[1]
local ttl = tonumber(ARGV[2])

local fetchedId = redis.call('GET' , KEYS[1])

if fetchedId == instanceId then
    redis.call('PEXPIRE' , KEYS[1] ,ttl)
    return 1
else
    return 0
end
