using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TwitchClicker.Model;

namespace TwitchClicker.Server.Client.Pages
{
    public partial class Index : ComponentBase
    {
        private HubConnection hubConnection;
        [Inject] NavigationManager NavigationManager { get; set; }
        [Inject] IJSRuntime JSRuntime { get; set; }

        string _debug = "AAA";

        protected override async Task OnInitializedAsync()
        {
            hubConnection = new HubConnectionBuilder()
                .WithUrl(NavigationManager.ToAbsoluteUri("/contacthub"))
                .Build();

            hubConnection.On<ContactContent>("OnIceReceived", contact =>
            {
                _debug = contact.id;
                StateHasChanged();
            });

            await hubConnection.StartAsync();

            await base.OnInitializedAsync();
        }

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {
                //await JSRuntime.InvokeVoidAsync("setupWebRTC", DotNetObjectReference.Create(this));
            }
            await base.OnAfterRenderAsync(firstRender);
        }

    }
}
