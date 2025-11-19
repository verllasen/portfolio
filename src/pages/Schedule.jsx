import React, { useState, useEffect } from 'react'
import { teams, generateMatches } from '../utils/mockData'
import { format, parseISO, isToday, isPast, isFuture } from 'date-fns'
import { FaCalendarAlt, FaFilter } from 'react-icons/fa'
import MatchDetails from '../components/MatchDetails'
import './Schedule.css'

const Schedule = () => {
  const [matches] = useState(generateMatches())
  const [filteredMatches, setFilteredMatches] = useState(matches)
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    let filtered = [...matches]

    if (selectedTeam !== 'all') {
      filtered = filtered.filter(m => 
        m.homeTeam === parseInt(selectedTeam) || 
        m.awayTeam === parseInt(selectedTeam)
      )
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === selectedStatus)
    }

    if (selectedDate !== 'all') {
      const today = new Date()
      filtered = filtered.filter(m => {
        const matchDate = parseISO(m.date)
        if (selectedDate === 'today') return isToday(matchDate)
        if (selectedDate === 'past') return isPast(matchDate) && !isToday(matchDate)
        if (selectedDate === 'future') return isFuture(matchDate) && !isToday(matchDate)
        return true
      })
    }

    setFilteredMatches(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)))
  }, [matches, selectedTeam, selectedStatus, selectedDate])

  const getTeamById = (id) => teams.find(t => t.id === id)

  const groupMatchesByDate = (matches) => {
    const grouped = {}
    matches.forEach(match => {
      const date = format(parseISO(match.date), 'yyyy-MM-dd')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(match)
    })
    return grouped
  }

  const groupedMatches = groupMatchesByDate(filteredMatches)

  return (
    <div className="schedule-page">
      <div className="page-header">
        <h1>
          <FaCalendarAlt className="page-icon" />
          Расписание и результаты
        </h1>
        <p className="page-subtitle">Все матчи Премьер-лиги Танзании</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>
            <FaFilter className="filter-icon" />
            Команда:
          </label>
          <select 
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все команды</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Статус:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все</option>
            <option value="finished">Завершённые</option>
            <option value="scheduled">Запланированные</option>
            <option value="live">Живые</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Дата:</label>
          <select 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все даты</option>
            <option value="today">Сегодня</option>
            <option value="past">Прошедшие</option>
            <option value="future">Будущие</option>
          </select>
        </div>
      </div>

      <div className="matches-container">
        {Object.keys(groupedMatches).length > 0 ? (
          Object.keys(groupedMatches).map(date => {
            const dateMatches = groupedMatches[date]
            const dateObj = parseISO(date)
            const isTodayDate = isToday(dateObj)
            
            return (
              <div key={date} className="date-group">
                <div className="date-header">
                  <h2 className="date-title">
                    {isTodayDate && <span className="today-badge">СЕГОДНЯ</span>}
                    {format(dateObj, 'EEEE, d MMMM yyyy')}
                  </h2>
                  <span className="matches-count">{dateMatches.length} матчей</span>
                </div>
                
                <div className="matches-list">
                  {dateMatches.map(match => {
                    const home = getTeamById(match.homeTeam)
                    const away = getTeamById(match.awayTeam)
                    const matchDate = parseISO(match.date)
                    
                    return (
                      <div 
                        key={match.id} 
                        className={`match-card ${match.status} clickable`}
                        onClick={() => setSelectedMatch(match)}
                      >
                        <div className="match-time">
                          {format(matchDate, 'HH:mm')}
                        </div>
                        
                        <div className="match-content">
                          <div className="match-team home-team">
                            <span className="team-logo-large">{home.logo}</span>
                            <div className="team-info">
                              <span className="team-name-large">{home.name}</span>
                              <span className="team-city">{home.city}</span>
                            </div>
                          </div>
                          
                          <div className="match-result">
                            {match.status === 'finished' ? (
                              <>
                                <span className="score-large">{match.homeScore}</span>
                                <span className="separator-large">:</span>
                                <span className="score-large">{match.awayScore}</span>
                              </>
                            ) : (
                              <span className="vs-large">VS</span>
                            )}
                          </div>
                          
                          <div className="match-team away-team">
                            <div className="team-info">
                              <span className="team-name-large">{away.name}</span>
                              <span className="team-city">{away.city}</span>
                            </div>
                            <span className="team-logo-large">{away.logo}</span>
                          </div>
                        </div>
                        
                        <div className="match-footer">
                          <span className="round-badge">Тур {match.round}</span>
                          {match.status === 'finished' && (
                            <span className="status-badge finished">Завершён</span>
                          )}
                          {match.status === 'scheduled' && (
                            <span className="status-badge scheduled">Запланирован</span>
                          )}
                          {match.status === 'live' && (
                            <span className="status-badge live pulse">LIVE</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        ) : (
          <div className="no-matches-found">
            <p>Матчи не найдены</p>
            <p className="no-matches-hint">Попробуйте изменить фильтры</p>
          </div>
        )}
      </div>

      {/* Модальное окно с деталями матча */}
      {selectedMatch && (
        <MatchDetails
          match={selectedMatch}
          homeTeam={getTeamById(selectedMatch.homeTeam)}
          awayTeam={getTeamById(selectedMatch.awayTeam)}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}

export default Schedule

