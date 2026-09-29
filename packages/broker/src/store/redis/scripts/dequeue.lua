local token = ARGV[1]
local ttl = tonumber(ARGV[2])
local leasePrefix = ARGV[3]
local currentTime = tonumber(ARGV[4])
local expiryScore = currentTime + ttl

local popped = redis.call('ZPOPMIN' , KEYS[1] , 1)

if #popped == 0 then
    return {}
end
local jobId = popped[1]
redis.call('SET' , leasePrefix .. jobId , token , 'PX' , ttl)
redis.call('ZADD' , KEYS[2] , expiryScore , jobId) 

return popped