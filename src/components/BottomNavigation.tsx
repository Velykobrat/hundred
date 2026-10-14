import Icon from "./Icon";

export type Screen = "home" | "resource" | "settings";
const destinations = [
  { screen: "home", label: "Головна", icon: "home" },
  { screen: "resource", label: "Ресурс", icon: "resource" },
  { screen: "settings", label: "Налаштування", icon: "settings" },
] as const;

export default function BottomNavigation({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  return <nav className="bottom-navigation" aria-label="Основна навігація">
    <div className="bottom-navigation-inner">
      {destinations.map((destination) => <button key={destination.screen} type="button" aria-current={screen === destination.screen ? "page" : undefined} onClick={() => onNavigate(destination.screen)}>
        <Icon name={destination.icon} width="23" height="23" />
        <span>{destination.label}</span>
      </button>)}
    </div>
  </nav>;
}
