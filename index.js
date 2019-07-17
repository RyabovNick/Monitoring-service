require('dotenv').config();
const sql = require('mssql');
const moment = require('moment');
const pool = require('./config/config');
const { logger } = require('./lib/logger');
const axios = require('axios');

const interval = 0.3 * 60 * 1000;

// при старте отправляем сообщения, добавленные
// за последние 10 минут
let date_from = moment()
  .subtract(280, 'minutes')
  .add(3, 'hours')
  .toISOString();

setInterval(function() {
  pool.connect(err => {
    if (err) logger.log('error', 'Connection error', { err });

    const request = new sql.Request(pool);
    request.input('date_start', sql.DateTime2, date_from);
    // убрать получение только insert
    // надо всё, только проверять что произошло
    request.query(
      `
      SELECT TOP (10) 
        _Document30_IDRRef as link
        ,[time].[tran_begin_time] as time_start
        ,[time].[tran_end_time] as time_finish
        ,[__$operation] as [action]
        ,_Fld207 as [day]
        ,par.Код as [lesson]
        ,kab.[Наименование] as cabinet
        ,prep.Наименование as teacher
        ,prep.КраткоеНаименование as teacher_short
        ,disc.Наименование as discipline
        ,disc.КраткоеНаименование as discipline_short
        ,gr.Наименование as [group]
      FROM [UniASR].[cdc].[cdcauditing__Document30_VT205_CT] as main
        INNER JOIN [UniASR].[cdc].[lsn_time_mapping] as [time] on main.[__$start_lsn] = [time].[start_lsn]
        INNER JOIN [UniASR].[dbo].[Справочник_Помещения] as kab on main.[_Fld211RRef] = kab.Ссылка
        INNER JOIN [UniASR].[dbo].[Справочник_Занятия] as zan on main.[_Fld210RRef] = zan.Ссылка
        INNER JOIN [UniASR].[dbo].[Справочник_Преподаватели] as prep on zan.[Преподаватель_Ссылка] = prep.Ссылка
        INNER JOIN [UniASR].[dbo].[Справочник_Дисциплины] as disc on zan.[Дисциплина_Ссылка] = disc.Ссылка 
        INNER JOIN [UniASR].[dbo].[Справочник_Занятия_Группы] as zan_gr on zan.Ссылка = zan_gr.Ссылка
        INNER JOIN [UniASR].[dbo].[Справочник_Группы] as gr on zan_gr.Группа_Ссылка = gr.Ссылка
        INNER JOIN [UniASR].[dbo].[Справочник_ВременныеОкна] as par on main.[_Fld208RRef] = par.Ссылка
      WHERE [time].[tran_end_time] > @date_start and [__$operation] = 2 -- только insert
      ORDER BY time_finish desc
      `,
      (error, result) => {
        if (error) logger.log('error', 'Request error', { error });

        // новая дата
        date_from = moment()
          .subtract(25, 'ms') // страховка на случай небольшой задержки передачи
          .add(3, 'hours')
          .toISOString();

        if (result.recordset.length !== 0) {
          const {
            day,
            lesson,
            cabinet,
            teacher_short,
            discipline_short,
            group,
          } = result.recordset[0]; // сделать в цикле
          console.log('result.recordset[0]: ', result.recordset[0]);

          axios({
            method: 'post',
            url: `${process.env.PUSH_SERVICE}push`,
            data: {
              title: 'Изменение в расписании',
              content: `${day} ${lesson} ${cabinet} ${teacher_short} ${discipline_short}`,
              topic: 'all',
            },
          })
            .then(res => {
              logger.log('info', 'Push successfully send', { res });
            })
            .catch(err1 => {
              logger.log('error', 'Push request error', { err1 });
            });
        }

        pool.close();
      },
    );
  });
}, interval);
