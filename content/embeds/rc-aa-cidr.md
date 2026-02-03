Every CIDR should be unique to properly route network traffic between each Active-Active database instance and your consumer VPCs. The CIDR block regions should _not_ overlap between the Redis server and your app consumer VPCs. In addition, CIDR blocks should not overlap between cluster instances. 

When all **Deployment CIDR** regions display a green checkmark, you're ready to continue.  

{{<image filename="images/rc/icon-cidr-address-ok.png" width="30px" alt="Green checkmarks indicate valid CIDR address values." >}}

Red exclamation marks indicate error conditions; the tooltip provides additional details.

{{<image filename="images/rc/icon-cidr-address-error.png" width="30px" alt="Red exclamation points indicate CIDR address problems." >}} 