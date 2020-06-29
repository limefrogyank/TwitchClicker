using ReactiveUI;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Reactive.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Web;


using TwitchLib.Extension;
using TwitchLib.PubSub;
using TwitchLib.PubSub.Events;
using Windows.Security.Authentication.Web;

namespace TwitchClicker.Broadcaster.ViewModel
{
    public class ClientsViewModel:ReactiveObject, IRoutableViewModel
    {
        private string _accessToken;
        //private TwitchClient _twitchClient;
        private TwitchPubSub _twitchPubSub;

        public IScreen HostScreen { get; }

        public string UrlPathSegment { get; } = Guid.NewGuid().ToString().Substring(0, 5);

        public ClientsViewModel(IScreen screen)
        {
            HostScreen = screen;

            Initialize();
        }

        async void Initialize()
        {
            var scopes = new List<string> { "chat:edit", "user:read:broadcast", "whispers:read", "chat:read" };
            var callBack = WebAuthenticationBroker.GetCurrentApplicationCallbackUri().AbsoluteUri;
            var scopeString = string.Join(' ', scopes);
            var result =await WebAuthenticationBroker.AuthenticateAsync(
                WebAuthenticationOptions.None, 
                new Uri($"https://id.twitch.tv/oauth2/authorize?client_id=clamz3v91mk7v9unks4ylfwegnzlrq&redirect_uri={HttpUtility.UrlEncode(callBack)}&response_type=token&scope={scopeString}"),
                WebAuthenticationBroker.GetCurrentApplicationCallbackUri());

            if (result.ResponseStatus == WebAuthenticationStatus.Success)
            {
                var parameters = result.ResponseData.Split('#')[1].Split('&');
                foreach (var p in parameters)
                {
                    var pair = p.Split('=');
                    if (pair[0] == "access_token")
                        _accessToken = pair[1];
                }
            }

            //ConnectionCredentials credentials = new ConnectionCredentials("limefrogyank", _accessToken);
            //var clientOptions = new ClientOptions
            //{
            //    MessagesAllowedInPeriod = 750,
            //    ThrottlingPeriod = TimeSpan.FromSeconds(30)
            //};
            //WebSocketClient customClient = new WebSocketClient(clientOptions);
            //_twitchClient = new TwitchClient(customClient);
            ////_twitchClient.Initialize(credentials, "limefrogyank");
            ////_twitchClient.OnConnected += Client_OnConnected;
            ////_twitchClient.Connect();
            _twitchPubSub = new TwitchPubSub();

            _twitchPubSub.OnPubSubServiceConnected += _twitchPubSub_OnPubSubServiceConnected;

            _twitchPubSub.OnChannelExtensionBroadcast += _twitchPubSub_OnChannelExtensionBroadcast;

            //var OnExtensionBroadcast = Observable.FromEvent<EventHandler<OnChannelExtensionBroadcastArgs>, OnChannelExtensionBroadcastArgs>(
            //    handler =>(s, e) => handler(e),
            //    x => _twitchPubSub.OnChannelExtensionBroadcast += x,
            //    x=> _twitchPubSub.OnChannelExtensionBroadcast -= x
            //    );

            //OnExtensionBroadcast.Subscribe(x =>
            //{

            //    Debug.WriteLine($"Got a broadcast:  {string.Join(',',x.Messages)}");
            //});
            
            _twitchPubSub.ListenToVideoPlayback("limefrogyank");
            _twitchPubSub.ListenToChannelExtensionBroadcast("90375267", "ke3n5qbcmpo0en56f3relo3xn3u9b3");
            
            _twitchPubSub.Connect();

            StaticSecretExtension extension = new StaticSecretExtension(new ExtensionConfiguration
            {
                Id = "ke3n5qbcmpo0en56f3relo3xn3u9b3",
                OwnerId = "90375267",
                VersionNumber = "1.0.0",//e.g. 0.0.1
                StartingSecret = "DZfBCX9dLBuyrEWeE1a5cMa8TWoNtX9n1prGR1SLSH4="

            });

            //Verify a JWT
            //string jwt = "JWT STRING";
            //ClaimsPrincipal user = extension.Verify(jwt, out var validTokenOverlay);
            //if (user == null) throw new Exception("Not valid");

            //var secret = extension.CurrentSecret;

            //var channels = await extension.GetLiveChannelsWithExtensionActivatedAsync(null);

            
        }

        private void _twitchPubSub_OnChannelExtensionBroadcast(object sender, OnChannelExtensionBroadcastArgs e)
        {
            Debug.WriteLine($"Got a broadcast:  {string.Join(',', e.Messages)}");
        }

        private void _twitchPubSub_OnPubSubServiceConnected(object sender, EventArgs e)
        {
            Debug.WriteLine($"PubService Connected");
            _twitchPubSub.SendTopics();
            //var token = Microsoft.IdentityModel.JsonWebTokens.JwtTokenUtilities.CreateEncodedSignature("tokencontents", new SigningCredentials(new System.Security.Cryptography.X509Certificates.X509Certificate2()))
            //    _twitchPubSub.SendTopics();

        }

        public string GetToken()
        {
            string key = "DZfBCX9dLBuyrEWeE1a5cMa8TWoNtX9n1prGR1SLSH4="; //Secret key which will be used later during validation    
            var issuer = "https://www.twitch.tv/";//WebAuthenticationBroker.GetCurrentApplicationCallbackUri().AbsoluteUri;  //normally this will be your site URL    

            var securityKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Convert.FromBase64String(key));
            var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(securityKey, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

            //Create a List of Claims, Keep claims name short    
            var permClaims = new List<Claim>();
            permClaims.Add(new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()));
            permClaims.Add(new Claim("channel_id", "1"));
            permClaims.Add(new Claim("exp", (DateTimeOffset.Now + TimeSpan.FromSeconds(30)).ToUnixTimeSeconds().ToString()));
            permClaims.Add(new Claim("is_unlinked", "false"));
            permClaims.Add(new Claim("opaque_user_id", "someUser"));

            //Create Security Token object by giving required parameters    
            var token = new JwtSecurityToken(issuer, //Issure    
                            issuer,  //Audience    
                            permClaims,
                            expires: DateTime.Now.AddDays(1),
                            signingCredentials: credentials);
            var jwt_token = new JwtSecurityTokenHandler().WriteToken(token);
            return jwt_token;
        }

        //private void Client_OnConnected(object sender, OnConnectedArgs e)
        //{
        //    Debug.WriteLine($"Connected to {e.AutoJoinChannel}");
        //}
    }
}
