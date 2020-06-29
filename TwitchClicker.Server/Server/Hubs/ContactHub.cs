using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace TwitchClicker.Server.Server.Hubs
{
    public class ContactHub: Hub
    {
        public override Task OnConnectedAsync()
        {
            Debug.WriteLine(Context.ConnectionId + " has connected.");
            return base.OnConnectedAsync();
        }
        
        public override Task OnDisconnectedAsync(Exception exception)
        {
            Debug.WriteLine(Context.ConnectionId + " has disconnected.");
            return base.OnDisconnectedAsync(exception);
        }
    }
}
