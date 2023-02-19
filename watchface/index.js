import Vepp from 'vepp'
import config from './config'
const { schoolWeek, timeList } = config

WatchFace({
  build() {
    const { data: t } = new Vepp({
      ui: `
        #IMG  src: 'icon.png'
        #TEXT h: H * 0.125, text: battery, color: 0xffffff, text_size: 22
        #TEXT y: H * 0.1, h: H * 0.25, text: time_hour, color: 0xffffff, text_size: 84
        #TEXT y: H * 0.22, h: H * 0.25, text: time_second, color: 0xffffff, text_size: 40
        #TEXT y: H * 0.36, h: H * 0.25, text: date, color: 0xffffff, text_size: 22
        #TEXT y: H * 0.43, h: H * 0.25, text: week, color: 0xffffff, text_size: 22
        #TEXT y: H * 0.65, h: H * 0.25, text: schoolEvent, color: 0xffffff, text_size: 20
      `,
      data: {
        W: hmSetting.getDeviceInfo().width,
        H: hmSetting.getDeviceInfo().height,
        battery: '',
        time_hour: '',
        time_second: '',
        date: '',
        week: '',
        schoolEvent: ''
      }
    })
    let update = function () {
      const time = hmSensor.createSensor(hmSensor.id.TIME),
            battery = hmSensor.createSensor(hmSensor.id.BATTERY)
      let fill0 = (str) => str.length < 2 ? '0' + str : str,
          weekNum = () => {
            let leap = time.year % 100 == 0 ? time.year % 400 == 0 : time.year % 4 == 0
            let arr = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
            let days = 0
            for (let k = 0; k < time.month - 1; k ++) {
              let v = arr[k]
              days += v
            }
            days += time.day
            let mod = days % 7
            mod = mod > 0 ? mod : 7
            let diff = mod - time.week
            let wday = diff < 0 ? - diff : 7 - diff
            days += wday
            return Math.ceil(days / 7)
          },
          schoolWeekText = () => {
            let nweek = weekNum()
            if (nweek <= schoolWeek.end)
              return '第' + (nweek - schoolWeek.start + 1) + '学周'
            else
              return ''
          }
          weekText = () => {
            let arr = '一二三四五六日'.split('')
            return '周' + arr[time.week - 1]
          },
          schoolEvent = () => {
            let list = timeList[time.week - 1]
            if (! list)
              return 'Nothing to do~'
            let k = - 1
            for (let i in list) {
              i = parseInt(i)
              let v = list[i]
              let stime = v.stime.split(':'),
                  etime = v.etime.split(':')
              stime = [parseInt(stime[0]), parseInt(stime[1])]
              etime = [parseInt(etime[0]), parseInt(etime[1])]
              let ctime = [time.format_hour, time.minute]
              let cond1 = ctime[0] > stime[0] || (ctime[0] == stime[0] && ctime[1] >= stime[1]),
                  cond2 = ctime[0] < etime[0] || (ctime[0] == etime[0] && ctime[1] < etime[1])
              if (cond1 && cond2) {
                k = i
                break
              } else if (cond1) {
                k = - 2 - i
              }
            }

            const getName = (k) => list[k].name,
                  getDelay = (k, port = 0) => {
                    let v = list[k]
                    let dtime = (! port ? v.stime : v.etime),
                        ctime = [time.format_hour, time.minute]
                    dtime = dtime.split(':')
                    dtime = [parseInt(dtime[0]), parseInt(dtime[1])]
                    if (ctime[0] < dtime[0] || (ctime[0] == dtime[0] && ctime[1] <= dtime[1])) {
                      let s = ((dtime[0] - ctime[0]) * 60 * 60 + (dtime[1] - ctime[1]) * 60)
                      if (s >= 60 * 60)
                        return (s / 60 / 60).toFixed(1) + ' h'
                      else
                        return (s / 60).toFixed() + ' m'
                    } else {
                      return null
                    }
                  }
            if (k < 0) {
              let ok = - k - 2 + 1
              if (list[ok]) {
                let delay = getDelay(ok)
                return delay ? (delay + '后 ' + getName(ok)) : 'Nothing to do~'
              } else {
                return 'Nothing to do~'
              }
            }
            let next = list[k + 1] ? '\n下节 ' + getName(k + 1) : ''
            return getName(k) + ' 剩余' + getDelay(k, 1) + next
          }
      
      t.battery = '电量 ' + battery.current + '%'
      t.time_hour = time.format_hour + ''
      t.time_second = fill0(time.minute + '')
      t.date = time.month + '/' + time.day + ' ' + weekText()
      t.week = schoolWeekText()
      t.schoolEvent = schoolEvent()
    }
    update()
    setInterval(update, 300)
  }
})