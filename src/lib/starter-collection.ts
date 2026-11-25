import { decodeCollection, type Collection } from "./collection";

const starterData = {
  "version": 3,
  "documents": [
    {
      "root": {
        "id": "starter-life",
        "name": "Моє життя",
        "mode": "structural",
        "weight": 1,
        "color": "#7557a5",
        "icon": "heart",
        "children": [
          {
            "id": "starter-life-work",
            "name": "Робота",
            "mode": "structural",
            "weight": 1,
            "color": "#3b6b9d",
            "icon": "briefcase",
            "children": [
              {
                "id": "starter-life-work-main",
                "name": "Основна робота",
                "mode": "structural",
                "weight": 1,
                "icon": "briefcase",
                "children": []
              },
              {
                "id": "starter-life-work-growth",
                "name": "Професійний розвиток",
                "mode": "structural",
                "weight": 1,
                "icon": "target",
                "children": [
                  {
                    "id": "starter-life-work-growth-skills",
                    "name": "Навички",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "bolt",
                    "children": []
                  },
                  {
                    "id": "starter-life-work-growth-portfolio",
                    "name": "Портфоліо",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "folder",
                    "children": []
                  },
                  {
                    "id": "starter-life-work-growth-network",
                    "name": "Нетворкінг",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "people",
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-life-work-projects",
                "name": "Власні проєкти",
                "mode": "structural",
                "weight": 1,
                "color": "#277b72",
                "icon": "project",
                "children": [
                  {
                    "id": "starter-life-work-projects-ideas",
                    "name": "Ідеї",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "star",
                    "children": []
                  },
                  {
                    "id": "starter-life-work-projects-active",
                    "name": "Активні",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "bolt",
                    "children": []
                  },
                  {
                    "id": "starter-life-work-projects-done",
                    "name": "Завершені",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "folder",
                    "children": []
                  }
                ]
              }
            ]
          },
          {
            "id": "starter-life-study",
            "name": "Навчання",
            "mode": "structural",
            "weight": 1,
            "color": "#555ab5",
            "icon": "book",
            "children": [
              {
                "id": "starter-life-study-formal",
                "name": "Формальна освіта",
                "mode": "structural",
                "weight": 1,
                "icon": "book",
                "children": []
              },
              {
                "id": "starter-life-study-self",
                "name": "Самоосвіта",
                "mode": "structural",
                "weight": 1,
                "icon": "target",
                "children": [
                  {
                    "id": "starter-life-study-self-tech",
                    "name": "Технічні навички",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "bolt",
                    "children": []
                  },
                  {
                    "id": "starter-life-study-self-languages",
                    "name": "Мови",
                    "mode": "structural",
                    "weight": 1,
                    "icon": "globe",
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-life-study-materials",
                "name": "Книги та матеріали",
                "mode": "structural",
                "weight": 1,
                "icon": "book",
                "children": []
              }
            ]
          },
          {
            "id": "starter-life-health",
            "name": "Здоров’я",
            "mode": "structural",
            "weight": 1,
            "color": "#347b5c",
            "icon": "heart",
            "children": [
              {
                "id": "starter-life-health-fitness",
                "name": "Фізична форма",
                "mode": "structural",
                "weight": 1,
                "icon": "bolt",
                "children": [
                  {
                    "id": "starter-life-health-fitness-strength",
                    "name": "Силові",
                    "mode": "structural",
                    "weight": 1,
                    "children": []
                  },
                  {
                    "id": "starter-life-health-fitness-cardio",
                    "name": "Кардіо",
                    "mode": "structural",
                    "weight": 1,
                    "children": []
                  },
                  {
                    "id": "starter-life-health-fitness-mobility",
                    "name": "Мобільність",
                    "mode": "structural",
                    "weight": 1,
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-life-health-sleep",
                "name": "Сон",
                "mode": "structural",
                "weight": 1,
                "icon": "clock",
                "children": []
              },
              {
                "id": "starter-life-health-recovery",
                "name": "Відновлення",
                "mode": "structural",
                "weight": 1,
                "icon": "coffee",
                "children": []
              }
            ]
          },
          {
            "id": "starter-life-finance",
            "name": "Фінанси",
            "mode": "structural",
            "weight": 1,
            "color": "#317c91",
            "icon": "money",
            "children": [
              {
                "id": "starter-life-finance-income",
                "name": "Доходи",
                "mode": "structural",
                "weight": 1,
                "icon": "money",
                "children": []
              },
              {
                "id": "starter-life-finance-expenses",
                "name": "Витрати",
                "mode": "structural",
                "weight": 1,
                "icon": "money",
                "children": []
              },
              {
                "id": "starter-life-finance-reserve",
                "name": "Резерв",
                "mode": "structural",
                "weight": 1,
                "icon": "shield",
                "children": []
              },
              {
                "id": "starter-life-finance-invest",
                "name": "Інвестиції",
                "mode": "structural",
                "weight": 1,
                "icon": "target",
                "children": []
              }
            ]
          },
          {
            "id": "starter-life-relationships",
            "name": "Стосунки",
            "mode": "structural",
            "weight": 1,
            "color": "#9b5075",
            "icon": "people",
            "children": [
              {
                "id": "starter-life-relationships-family",
                "name": "Сім’я",
                "mode": "structural",
                "weight": 1,
                "icon": "heart",
                "children": []
              },
              {
                "id": "starter-life-relationships-friends",
                "name": "Друзі",
                "mode": "structural",
                "weight": 1,
                "icon": "people",
                "children": []
              },
              {
                "id": "starter-life-relationships-social",
                "name": "Соціальність",
                "mode": "structural",
                "weight": 1,
                "icon": "globe",
                "children": []
              }
            ]
          },
          {
            "id": "starter-life-home",
            "name": "Дім",
            "mode": "structural",
            "weight": 1,
            "color": "#8d692e",
            "icon": "home",
            "children": [
              {
                "id": "starter-life-home-routine",
                "name": "Побут",
                "mode": "structural",
                "weight": 1,
                "icon": "home",
                "children": []
              },
              {
                "id": "starter-life-home-shopping",
                "name": "Покупки",
                "mode": "structural",
                "weight": 1,
                "icon": "money",
                "children": []
              },
              {
                "id": "starter-life-home-improve",
                "name": "Покращення",
                "mode": "structural",
                "weight": 1,
                "icon": "project",
                "children": []
              }
            ]
          },
          {
            "id": "starter-life-rest",
            "name": "Відпочинок",
            "mode": "structural",
            "weight": 1,
            "color": "#87539a",
            "icon": "coffee",
            "children": [
              {
                "id": "starter-life-rest-travel",
                "name": "Подорожі",
                "mode": "structural",
                "weight": 1,
                "icon": "globe",
                "children": []
              },
              {
                "id": "starter-life-rest-hobby",
                "name": "Хобі",
                "mode": "structural",
                "weight": 1,
                "icon": "star",
                "children": []
              },
              {
                "id": "starter-life-rest-entertainment",
                "name": "Розваги",
                "mode": "structural",
                "weight": 1,
                "icon": "coffee",
                "children": []
              }
            ]
          }
        ]
      },
      "pathIds": [
        "starter-life"
      ]
    },
    {
      "root": {
        "id": "starter-budget",
        "name": "Місячний бюджет",
        "mode": "measured",
        "value": 100000,
        "unit": "грн",
        "color": "#277b72",
        "icon": "money",
        "children": [
          {
            "id": "starter-budget-home",
            "name": "Житло",
            "mode": "measured",
            "value": 25000,
            "unit": "грн",
            "color": "#3b6b9d",
            "icon": "home",
            "children": [
              {
                "id": "starter-budget-home-rent",
                "name": "Оренда",
                "mode": "measured",
                "value": 18000,
                "unit": "грн",
                "icon": "home",
                "children": []
              },
              {
                "id": "starter-budget-home-utilities",
                "name": "Комунальні",
                "mode": "measured",
                "value": 4000,
                "unit": "грн",
                "icon": "bolt",
                "children": [
                  {
                    "id": "starter-budget-home-utilities-electric",
                    "name": "Електроенергія",
                    "mode": "measured",
                    "value": 1500,
                    "unit": "грн",
                    "children": []
                  },
                  {
                    "id": "starter-budget-home-utilities-water",
                    "name": "Вода",
                    "mode": "measured",
                    "value": 800,
                    "unit": "грн",
                    "children": []
                  },
                  {
                    "id": "starter-budget-home-utilities-heating",
                    "name": "Опалення",
                    "mode": "measured",
                    "value": 1200,
                    "unit": "грн",
                    "children": []
                  },
                  {
                    "id": "starter-budget-home-utilities-service",
                    "name": "Обслуговування",
                    "mode": "measured",
                    "value": 500,
                    "unit": "грн",
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-budget-home-internet",
                "name": "Інтернет і зв’язок",
                "mode": "measured",
                "value": 1000,
                "unit": "грн",
                "icon": "globe",
                "children": []
              },
              {
                "id": "starter-budget-home-household",
                "name": "Побут",
                "mode": "measured",
                "value": 2000,
                "unit": "грн",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-food",
            "name": "Харчування",
            "mode": "measured",
            "value": 18000,
            "unit": "грн",
            "color": "#a3623d",
            "icon": "coffee",
            "children": [
              {
                "id": "starter-budget-food-groceries",
                "name": "Продукти",
                "mode": "measured",
                "value": 12000,
                "unit": "грн",
                "children": [
                  {
                    "id": "starter-budget-food-groceries-supermarket",
                    "name": "Супермаркет",
                    "mode": "measured",
                    "value": 9000,
                    "unit": "грн",
                    "children": []
                  },
                  {
                    "id": "starter-budget-food-groceries-market",
                    "name": "Ринок",
                    "mode": "measured",
                    "value": 3000,
                    "unit": "грн",
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-budget-food-cafe",
                "name": "Кафе",
                "mode": "measured",
                "value": 3500,
                "unit": "грн",
                "icon": "coffee",
                "children": []
              },
              {
                "id": "starter-budget-food-delivery",
                "name": "Доставка",
                "mode": "measured",
                "value": 2500,
                "unit": "грн",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-transport",
            "name": "Транспорт",
            "mode": "measured",
            "value": 8000,
            "unit": "грн",
            "color": "#317c91",
            "icon": "globe",
            "children": [
              {
                "id": "starter-budget-transport-fuel",
                "name": "Паливо",
                "mode": "measured",
                "value": 4000,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-transport-public",
                "name": "Громадський транспорт",
                "mode": "measured",
                "value": 1500,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-transport-taxi",
                "name": "Таксі",
                "mode": "measured",
                "value": 1500,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-transport-service",
                "name": "Обслуговування",
                "mode": "measured",
                "value": 1000,
                "unit": "грн",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-health",
            "name": "Здоров’я",
            "mode": "measured",
            "value": 6000,
            "unit": "грн",
            "color": "#347b5c",
            "icon": "heart",
            "children": [
              {
                "id": "starter-budget-health-sport",
                "name": "Спорт",
                "mode": "measured",
                "value": 2000,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-health-pharmacy",
                "name": "Аптека",
                "mode": "measured",
                "value": 1500,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-health-doctors",
                "name": "Лікарі",
                "mode": "measured",
                "value": 1500,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-health-care",
                "name": "Догляд",
                "mode": "measured",
                "value": 1000,
                "unit": "грн",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-family",
            "name": "Сім’я",
            "mode": "measured",
            "value": 8000,
            "unit": "грн",
            "color": "#9b5075",
            "icon": "people",
            "children": [
              {
                "id": "starter-budget-family-shared",
                "name": "Спільні витрати",
                "mode": "measured",
                "value": 4000,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-family-gifts",
                "name": "Подарунки",
                "mode": "measured",
                "value": 1500,
                "unit": "грн",
                "icon": "star",
                "children": []
              },
              {
                "id": "starter-budget-family-support",
                "name": "Підтримка",
                "mode": "measured",
                "value": 2500,
                "unit": "грн",
                "icon": "heart",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-growth",
            "name": "Розвиток",
            "mode": "measured",
            "value": 7000,
            "unit": "грн",
            "color": "#555ab5",
            "icon": "book",
            "children": [
              {
                "id": "starter-budget-growth-courses",
                "name": "Курси",
                "mode": "measured",
                "value": 3000,
                "unit": "грн",
                "icon": "book",
                "children": [
                  {
                    "id": "starter-budget-growth-courses-professional",
                    "name": "Професійні",
                    "mode": "measured",
                    "value": 1500,
                    "unit": "грн",
                    "children": []
                  },
                  {
                    "id": "starter-budget-growth-courses-language",
                    "name": "Мови",
                    "mode": "measured",
                    "value": 1500,
                    "unit": "грн",
                    "icon": "globe",
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-budget-growth-books",
                "name": "Книги",
                "mode": "measured",
                "value": 1000,
                "unit": "грн",
                "icon": "book",
                "children": []
              },
              {
                "id": "starter-budget-growth-subscriptions",
                "name": "Підписки",
                "mode": "measured",
                "value": 1000,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-growth-tools",
                "name": "Інструменти",
                "mode": "measured",
                "value": 2000,
                "unit": "грн",
                "icon": "project",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-rest",
            "name": "Відпочинок",
            "mode": "measured",
            "value": 5000,
            "unit": "грн",
            "color": "#87539a",
            "icon": "coffee",
            "children": [
              {
                "id": "starter-budget-rest-hobby",
                "name": "Хобі",
                "mode": "measured",
                "value": 2000,
                "unit": "грн",
                "icon": "star",
                "children": []
              },
              {
                "id": "starter-budget-rest-events",
                "name": "Кіно та події",
                "mode": "measured",
                "value": 1000,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-rest-trips",
                "name": "Поїздки",
                "mode": "measured",
                "value": 2000,
                "unit": "грн",
                "icon": "globe",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-savings",
            "name": "Заощадження",
            "mode": "measured",
            "value": 15000,
            "unit": "грн",
            "color": "#657838",
            "icon": "shield",
            "children": [
              {
                "id": "starter-budget-savings-reserve",
                "name": "Резерв",
                "mode": "measured",
                "value": 7000,
                "unit": "грн",
                "icon": "shield",
                "children": [
                  {
                    "id": "starter-budget-savings-reserve-emergency",
                    "name": "Фінансова подушка",
                    "mode": "measured",
                    "value": 5000,
                    "unit": "грн",
                    "children": []
                  },
                  {
                    "id": "starter-budget-savings-reserve-planned",
                    "name": "Великі витрати",
                    "mode": "measured",
                    "value": 2000,
                    "unit": "грн",
                    "children": []
                  }
                ]
              },
              {
                "id": "starter-budget-savings-invest",
                "name": "Інвестиції",
                "mode": "measured",
                "value": 5000,
                "unit": "грн",
                "icon": "target",
                "children": []
              },
              {
                "id": "starter-budget-savings-goal",
                "name": "Велика ціль",
                "mode": "measured",
                "value": 3000,
                "unit": "грн",
                "icon": "target",
                "children": []
              }
            ]
          },
          {
            "id": "starter-budget-other",
            "name": "Інше",
            "mode": "measured",
            "value": 8000,
            "unit": "грн",
            "color": "#8d692e",
            "icon": "folder",
            "children": [
              {
                "id": "starter-budget-other-clothes",
                "name": "Одяг",
                "mode": "measured",
                "value": 3000,
                "unit": "грн",
                "children": []
              },
              {
                "id": "starter-budget-other-unexpected",
                "name": "Непередбачене",
                "mode": "measured",
                "value": 3000,
                "unit": "грн",
                "icon": "shield",
                "children": []
              },
              {
                "id": "starter-budget-other-small",
                "name": "Дрібні покупки",
                "mode": "measured",
                "value": 2000,
                "unit": "грн",
                "children": []
              }
            ]
          }
        ]
      },
      "pathIds": [
        "starter-budget"
      ]
    }
  ],
  "activeId": "starter-life"
};

export function createStarterCollection(): Collection {
  return decodeCollection(JSON.stringify(starterData));
}
