using Microsoft.AspNetCore.Components;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.JSInterop;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TwitchClicker.Model;

namespace TwitchClicker.Pages
{
    public partial class VideoOverlay : ComponentBase
    {
        [Inject] private HttpClient HttpClient { get; set; }
        [Inject] private IJSRuntime JSRuntime { get; set; }

        
        string _registration = "";
        string _username;
        string _token;

        protected async void OnClickHandler()
        {
            var offer = await JSRuntime.InvokeAsync<RTCSessionDescriptionInit>("startWebRTC");
            await HttpClient.PostAsJsonAsync("https://localhost:44337/api/contact", new Dictionary<string,string>(){ {"id", offer.sdp } });
        }

        //[JSInvokable] public Task OnOfferAsync(RTCSessionDescriptionInit offer)
        //{
        //    return Task.CompletedTask;
        //}

        protected override async Task OnAfterRenderAsync(bool firstRender)
        {
            if (firstRender)
            {                
                var twitchReg = await JSRuntime.InvokeAsync<Dictionary<string, string>>("registerListener", DotNetObjectReference.Create(this));
                _registration = twitchReg["registration"];
                _token = twitchReg["token"];
                _username = twitchReg["userId"];
                Debug.WriteLine($"Registered: {_registration}");
                Debug.WriteLine($"UserId: {_username}, Token: {_token}");
                if (_token != "")
                {
                    var processed = ProcessJWT(_token);
                    
                }
                
                await JSRuntime.InvokeVoidAsync("listen", DotNetObjectReference.Create(this), "broadcast");

                await JSRuntime.InvokeVoidAsync("setupWebRTC", DotNetObjectReference.Create(this));

            }

            await base.OnAfterRenderAsync(firstRender);
        }

        private JwtSecurityToken ProcessJWT(string token)
        {
            try
            {
                var jwt = new JwtSecurityToken(token);
                Debug.WriteLine(jwt.Claims.FirstOrDefault(x => x.Type == "opaque_user_id").Value);
                return jwt;
            }
            catch(Exception ex)
            {
                Debug.WriteLine(ex.Message);
                return null;
            }
        }
                

        [JSInvokable] public Task OnAuthorizedHandlerAsync(Dictionary<string,string> auth)
        {
            _token = auth["token"];
            _username = auth["userId"];
            Debug.WriteLine($"UserId: {_username}, Token: {_token}");

            return Task.CompletedTask;
        }
    }
}
