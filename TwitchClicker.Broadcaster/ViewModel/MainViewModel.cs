using ReactiveUI;
using Splat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TwitchClicker.Broadcaster.View;

namespace TwitchClicker.Broadcaster.ViewModel
{
    public class MainViewModel: ReactiveObject, IScreen
    {
        public RoutingState Router { get; } = new RoutingState();

        public MainViewModel()
        {
            Locator.CurrentMutable.Register(() => new ClientsView(), typeof(IViewFor<ClientsViewModel>));
            Router.Navigate.Execute(new ClientsViewModel(this));
        }

    }
}
