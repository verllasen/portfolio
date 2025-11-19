// Mock данные для демонстрации

export const teams = [
  { id: 1, name: 'Simba SC', logo: '⚽', city: 'Дар-эс-Салам' },
  { id: 2, name: 'Young Africans', logo: '⚽', city: 'Дар-эс-Салам' },
  { id: 3, name: 'Azam FC', logo: '⚽', city: 'Дар-эс-Салам' },
  { id: 4, name: 'Coastal Union', logo: '⚽', city: 'Танга' },
  { id: 5, name: 'Mtibwa Sugar', logo: '⚽', city: 'Морогоро' },
  { id: 6, name: 'Kagera Sugar', logo: '⚽', city: 'Букоба' },
  { id: 7, name: 'Namungo FC', logo: '⚽', city: 'Линди' },
  { id: 8, name: 'Polisi Tanzania', logo: '⚽', city: 'Додома' },
  { id: 9, name: 'Geita Gold', logo: '⚽', city: 'Гейта' },
  { id: 10, name: 'Biashara United', logo: '⚽', city: 'Мванза' },
  { id: 11, name: 'KMC FC', logo: '⚽', city: 'Дар-эс-Салам' },
  { id: 12, name: 'Ihefu SC', logo: '⚽', city: 'Мбея' },
]

export const generateMatches = () => {
  const matches = []
  const today = new Date()
  
  // Прошедшие матчи
  for (let i = 7; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    for (let j = 0; j < 3; j++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)]
      let awayTeam = teams[Math.floor(Math.random() * teams.length)]
      while (awayTeam.id === homeTeam.id) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)]
      }
      
      matches.push({
        id: matches.length + 1,
        date: date.toISOString(),
        homeTeam: homeTeam.id,
        awayTeam: awayTeam.id,
        homeScore: Math.floor(Math.random() * 4),
        awayScore: Math.floor(Math.random() * 4),
        status: 'finished',
        round: Math.floor(Math.random() * 30) + 1,
      })
    }
  }
  
  // Будущие матчи
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    for (let j = 0; j < 3; j++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)]
      let awayTeam = teams[Math.floor(Math.random() * teams.length)]
      while (awayTeam.id === homeTeam.id) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)]
      }
      
      matches.push({
        id: matches.length + 1,
        date: date.toISOString(),
        homeTeam: homeTeam.id,
        awayTeam: awayTeam.id,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        round: Math.floor(Math.random() * 30) + 1,
      })
    }
  }
  
  return matches.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export const generateLiveMatches = () => {
  const liveMatches = []
  const activeTeams = [...teams].sort(() => Math.random() - 0.5).slice(0, 4)
  
  for (let i = 0; i < 2; i++) {
    liveMatches.push({
      id: i + 1,
      homeTeam: activeTeams[i * 2].id,
      awayTeam: activeTeams[i * 2 + 1].id,
      homeScore: Math.floor(Math.random() * 3),
      awayScore: Math.floor(Math.random() * 3),
      minute: Math.floor(Math.random() * 90) + 1,
      status: 'live',
      events: [
        { type: 'goal', team: 'home', minute: 15, player: 'Игрок 1' },
        { type: 'yellow', team: 'away', minute: 32, player: 'Игрок 2' },
        { type: 'goal', team: 'away', minute: 45, player: 'Игрок 3' },
      ]
    })
  }
  
  return liveMatches
}

export const generateTable = () => {
  return teams.map((team, index) => ({
    position: index + 1,
    team: team.id,
    played: Math.floor(Math.random() * 20) + 10,
    won: Math.floor(Math.random() * 15) + 5,
    drawn: Math.floor(Math.random() * 5),
    lost: Math.floor(Math.random() * 5),
    goalsFor: Math.floor(Math.random() * 30) + 15,
    goalsAgainst: Math.floor(Math.random() * 20) + 5,
    goalDifference: 0,
    points: 0,
  })).map(team => {
    team.goalDifference = team.goalsFor - team.goalsAgainst
    team.points = team.won * 3 + team.drawn
    return team
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.goalDifference - a.goalDifference
  }).map((team, index) => ({
    ...team,
    position: index + 1
  }))
}

export const generatePlayers = () => {
  const positions = ['Вратарь', 'Защитник', 'Полузащитник', 'Нападающий']
  const players = []
  
  teams.forEach(team => {
    for (let i = 0; i < 5; i++) {
      players.push({
        id: players.length + 1,
        name: `Игрок ${players.length + 1}`,
        team: team.id,
        position: positions[Math.floor(Math.random() * positions.length)],
        goals: Math.floor(Math.random() * 15),
        assists: Math.floor(Math.random() * 10),
        matches: Math.floor(Math.random() * 20) + 5,
        yellowCards: Math.floor(Math.random() * 5),
        redCards: Math.floor(Math.random() * 2),
        rating: (Math.random() * 2 + 6).toFixed(1),
      })
    }
  })
  
  return players
}

export const generateFantasyLeagues = () => {
  return [
    { id: 1, name: 'Лига Чемпионов', participants: 1250, prize: '50,000 TZS' },
    { id: 2, name: 'Элитная Лига', participants: 850, prize: '30,000 TZS' },
    { id: 3, name: 'Премьер Лига', participants: 2100, prize: '75,000 TZS' },
    { id: 4, name: 'Супер Лига', participants: 450, prize: '25,000 TZS' },
  ]
}

