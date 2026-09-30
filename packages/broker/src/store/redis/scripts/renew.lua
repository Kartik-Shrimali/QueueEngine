local keyPrefix = ARGV[1]
local jobId = ARGV[2]
local token = ARGV[3]
local ttl = tonumber(ARGV[4])
local currentTime = tonumber(ARGV[5])

local leaseKey = keyPrefix .. jobId

local storedToken = redis.call('GET' , leaseKey)

if storedToken ~= token then 
    return 0
end

redis.call('PEXPIRE' , leaseKey , ttl)

local newExpiry = currentTime + ttl
redis.call('ZADD' , KEYS[1] , newExpiry , jobId)
return 1