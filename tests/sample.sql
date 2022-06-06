-- 6.4.4

create or replace table group.weather as
select * from json_weather_data_view
where date_trunc('month',observation_time) = '2018-01-01' 
limit 20;

-- 3.1.4

create or replace table trips
(tripduration integer,
  starttime timestamp,
  stoptime timestamp,
  start_station_id integer,
  start_station_name string,
  start_station_latitude float,
  start_station_longitude float,
  end_station_id integer,
  end_station_name string,
  end_station_latitude float,
  end_station_longitude float,
  bikeid integer,
  membership_type string,
  usertype string,
  birth_year integer,
  gender integer);

-- 7.2.6

select DISTINCT
start_station_name as "station",
count(*) as "rides"
from trips t
join super s
on s.id = t.id
left outer join my_table m
on t.id = m.id
inner join extra x 
on x.id = t.id
group by 1
order by 2 desc
limit 20;

-- 6.4.1

create view json_weather_data_view as
select v:time::timestamp as observation_time
     , v:city.id::int as city_id
     , v:city.name::string as city_name
     , v:city.country::string as country
     , v:city.coord.lat::float as city_lat
     , v:city.coord.lon::float as city_lon
     , v:clouds.all::int as clouds
     ,(v:main.temp::float) -273.15 as temp_avg
     ,(v:main.temp_min::float) -273.15 as temp_min
     ,(v:main.temp_max::float) -273.15 as temp_max
     , v:weather[0].main::string as weather
     , v:weather[0].description::string as weather_desc
     , v:weather[0].icon::string as weather_icon
     , v:wind.deg::float as wind_dir
     , v:wind.speed::float as wind_speed
  from json_weather_data
 where 1=1
and city_id = 5128638 ;

insert into target_tab ( monthly , a , max_b , max_c , sum_cnt , some_case )
with cte_1 as (select a.k_1
                  , a.k_2
                  , max(a.col) as max_col
                  from tab_d a inner join
                        tab_f b on (a.k_1 = b.k_1
                              and a.k_2 = b.k_2
                              and a.k_3 = b.k_3
                              and a.k_4 = b.k_4)
                  group by a.k_1, a.k_2),
cte_2 as (select a.k
            , max(b.v) as max_v
            , avg(c.v) as avg_v
            , min(d.v) as min_v
            , count(e.v) as cnt
      from tab_e a inner join
            tab_f b on a.k = b.k left outer join
            tab_g c on a.k = c.k left outer join
            tab_h d on a.k = d.k left outer join
            tab_i e on a.k = e.k
      group by a)
select from_timestamp(from_utc_timestamp(from_unixtime(cast(dttm/1000 as bigint)),'ROK'),'yyyy-mm') as monthly
     , a.a /* double-dashed comments will be replaced like C-style comments. */
     , max(a.b) as max_b /**
                          * multi
                          * line
                          * comments
                          * will be compressed into single-line.
                          */
     , max(a.c) as max_c
     , sum(b.cnt) as sum_cnt
     , nvl(cast(max(case when a.cnt > 0 and b.max_v > 0 then 'A'
                         when a.cnt > 0 and b.max_v < 0 then 'B'
                         when a.cnt < 0 then 'C'
                         when a.cnt < 0 then 'D'
                                        else (select max(case when a.k_1 is null then 'A'
                                                              when a.k_1 > 'V' then 'A'
                                                                               else 'B'
                                                         end) as v
                                                from cte_1 a
                                               where a.max_col > 120 and a.type in (select type from tab_t)
                                                 and a.type in ('A','B','C','D')
                                             )
                    end) as STRING) ,'') as some_case
  from (select a.k /* Reserved words in comments are treated as comments. */
             , b.v
             , c.max_v
             , c.avg_v
             , c.min_v
             , c.cnt
          from tab_a a inner join
               tab_b b on (a.k = b.k
                       and b.d = 'dd') left outer join /*+ shuffle */
               cte_2 c on (a.c = c.a)
         where a.col_1 >= 'filter' /* comment */
           and b.col_2 between 'fil' and 'ter'
           and a.col_2 > 0
       ) a left outer join
       (select a.k
             , max(v) as max_v
          from tab_c a
         where a.d >= 'filter'
         group by a.k
        having count(1) > 0
       ) b on (a.k = b.k)
 group by 1, 2
 order by 1, 2
;

WITH budget
	AS(
	SELECT DISTINCT 
		   SRC
		 , MRKT_CHANNEL
		 , SRC_AGGRTR
		 , PROG
		 , PROG_TYPE
		 , REG_SUB_REG
		 , MRKT
		 , KEYWORD_CAT
		 , TARGETING_TACTIC
		 , BUDGET_START_DT AS BUDGET_DT
		 , BUDGET_START_DT
		 , BUDGET_END_DT
		 , GOAL
		 , FIRST_VALUE(BUDGET) OVER (PARTITION BY SRC, MRKT_CHANNEL, SRC_AGGRTR
		 										, PROG, PROG_TYPE, REG_SUB_REG
												, MRKT, KEYWORD_CAT, TARGETING_TACTIC
												, BUDGET_START_DT, BUDGET_END_DT , GOAL 
		 								 ORDER BY MODIFIED_AT) AS BUDGET_FCT_AMT
		 , LAST_VALUE(BUDGET) OVER (PARTITION BY SRC, MRKT_CHANNEL, SRC_AGGRTR
		 										, PROG, PROG_TYPE, REG_SUB_REG
												, MRKT, KEYWORD_CAT, TARGETING_TACTIC
												, BUDGET_START_DT, BUDGET_END_DT , GOAL
		 								 ORDER BY MODIFIED_AT) AS BUDGET_FNL_AMT
	 FROM {{ ref('budget_goals') }} 
),
budget_el AS(
	SELECT DISTINCT 
		  SRC 
		, MRKT_CHANNEL 
		, SRC_AGGRTR 
		, PROG
		, PROG_TYPE
		, REG_SUB_REG 
		, MRKT 
		, KEYWORD_CAT
		, TARGETING_TACTIC
		, BUDGET_DT
		, BUDGET_START_DT
		, BUDGET_END_DT
		, GOAL	
		, SUM(BUDGET_FCT_AMT) OVER (PARTITION BY BUDGET_START_DT, KEYWORD_CAT, REG_SUB_REG) AS BUDGET_FCT_AMT
		, SUM(BUDGET_FNL_AMT) OVER (PARTITION BY BUDGET_START_DT, KEYWORD_CAT, REG_SUB_REG) AS BUDGET_FNL_AMT
	FROM BUDGET
   WHERE PROG_TYPE = 'EL'
),
budget_all as (
	SELECT
		  SRC 
		, MRKT_CHANNEL 
		, SRC_AGGRTR 
		, PROG
		, PROG_TYPE
		, REG_SUB_REG 
		, MRKT 
		, KEYWORD_CAT
		, TARGETING_TACTIC
		, BUDGET_DT
		, BUDGET_START_DT
		, BUDGET_END_DT 
		, BUDGET_FCT_AMT
		, BUDGET_FNL_AMT
		, max(GOAL) as GOAL	
		, SUM (CASE WHEN KEYWORD_CAT = 'Brand' 		AND PROG = 'lob'
					THEN BUDGET_FNL_AMT ELSE NULL END) 						AS EL_BND_lob
		, SUM (CASE WHEN KEYWORD_CAT = 'Brand' 		AND PROG = 'Product'
					THEN BUDGET_FNL_AMT ELSE NULL END) 						AS EL_BND_MED
		, SUM (CASE WHEN KEYWORD_CAT = 'Brand' 		AND PROG = 'B2B'
					THEN BUDGET_FNL_AMT ELSE NULL END) 						AS EL_BND_B2B
		, SUM (CASE WHEN KEYWORD_CAT = 'Non-Brand'  AND PROG = 'lob'
					THEN BUDGET_FNL_AMT ELSE NULL END) 						AS EL_NBND_lob
		, SUM (CASE WHEN KEYWORD_CAT = 'Non-Brand'  AND PROG = 'Brand Advertising' 
					THEN BUDGET_FNL_AMT ELSE NULL END) 						AS EL_NBND_BND
	FROM budget_el 
	GROUP BY 1, 2,3,4,5,6,7,8,9,10,11,12,13,14
UNION ALL 
	SELECT
		  SRC 
		, MRKT_CHANNEL 
		, SRC_AGGRTR 
		, PROG
		, PROG_TYPE
		, REG_SUB_REG 
		, MRKT 
		, KEYWORD_CAT
		, TARGETING_TACTIC
		, BUDGET_DT
		, BUDGET_START_DT
		, BUDGET_END_DT
		, BUDGET_FCT_AMT
		, BUDGET_FNL_AMT
		, max(GOAL) as GOAL
		, NULL AS EL_BND_lob
		, NULL AS EL_BND_MED
		, NULL AS EL_BND_B2B
		, NULL AS EL_NBND_lob
		, NULL AS EL_NBND_BND
	FROM BUDGET 
   WHERE COALESCE(upper(PROG_TYPE), 'CORE') = 'CORE'
   GROUP BY 1, 2,3,4,5,6,7,8,9,10,11,12,13,14
),
fnl as (
select 
	{{ dbt_utils.surrogate_key('MRKT_CHANNEL'
                              ,'PROG'
                              ,'PROG_TYPE'
                              ,'REG_SUB_REG'
                              ,'TARGETING_TACTIC'
                              ,'KEYWORD_CAT') }}
				as surr_prog_id
		, BUDGET_DT
		, BUDGET_START_DT
		, BUDGET_END_DT
		, SRC 
		, MRKT_CHANNEL 
		, SRC_AGGRTR 
		, PROG
		, PROG_TYPE
		, REG_SUB_REG 
		, MRKT 
		, KEYWORD_CAT
		, TARGETING_TACTIC
		, GOAL 
		, BUDGET_FCT_AMT
		, BUDGET_FNL_AMT
		, EL_BND_lob
		, EL_BND_MED
		, EL_BND_B2B
		, EL_NBND_lob
		, EL_NBND_BND
	FROM budget_all
)

select * from fnl;



CREATE OR REPLACE TABLE "BIM_QUERY_USAGE"
AS

    SELECT u.*

         , CASE WHEN u.QUERY_TEXT LIKE '%SELECT%' AND sum(u.QTY_EXECUTIONS) > 10 THEN 1

                ELSE 0

           END AS SELECT_10

      FROM (SELECT WAREHOUSE_NAME

                 , ROLE_NAME

                 , USER_NAME

                 , QUERY_ID

                 , QUERY_TEXT

                 , COUNT(*) AS "QTY_EXECUTIONS"

                 , MAX(EXECUTION_TIME) AS "TIME_EXECUTION_MAX"

                 , SUM(EXECUTION_TIME) /COUNT(QUERY_ID) AS "TIME_EXECUTION_AVG"

                 , MAX(QUEUED_OVERLOAD_TIME) AS "TIME_QUEUED_OVERLOAD_MAX"

                 , SUM(QUEUED_OVERLOAD_TIME) /COUNT(QUERY_ID) AS "TIME_QUEUED_OVERLOAD_AVG"

                 , MAX(BYTES_SPILLED_TO_LOCAL_STORAGE) AS "BYTES_SPILLED_TO_LOCAL_STORAGE_MAX"

                 , SUM(BYTES_SPILLED_TO_LOCAL_STORAGE) /COUNT(QUERY_ID) AS "BYTES_SPILLED_TO_LOCAL_STORAGE_AVG"

                 , MAX(BYTES_SPILLED_TO_REMOTE_STORAGE) AS "BYTES_SPILLED_TO_REMOTE_STORAGE_MAX"

                 , SUM(BYTES_SPILLED_TO_REMOTE_STORAGE) /COUNT(QUERY_ID) AS "BYTES_SPILLED_TO_REMOTE_STORAGE_AVG"

                 , MAX(BYTES_SENT_OVER_THE_NETWORK) AS "BYTES_SENT_OVER_THE_NETWORK_MAX"

                 , SUM(BYTES_SENT_OVER_THE_NETWORK) /COUNT(QUERY_ID) AS "BYTES_SENT_OVER_THE_NETWORK_AVG"

              FROM BIM_ACCT_USAGE

             WHERE 1=1

               AND START_TIME >= DATEADD(MONTH, -2, CURRENT_DATE())

          GROUP BY 1, 2, 3, 4, 5

           ) u

;

UPDATE
     /* Updates the tables that had no query history to reflect that they are being used implicitly by a view definition */
     BUSINESS_ANALYTICS.PERFORMANCE_CHECKS.BIM_TABLE_USAGE T
        SET T.LAST_TIME_USED_TRUCATED_TO_MONTH = V.LAST_TIME_USED_TRUCATED_TO_MONTH
          , T.DIFFERENCE_WITH_CURRENT_MONTH = V.DIFFERENCE_WITH_CURRENT_MONTH
          , T.BUCKET_ID = V.BUCKET_ID
          , T.BUCKETS = V.BUCKETS
       FROM BUSINESS_ANALYTICS.PERFORMANCE_CHECKS.BIM_TABLES_USED_IN_VIEWS V
      WHERE 1=1
        AND T.TABLE_NAME = V.TABLE_NAME
        AND T.TABLE_SCHEMA = V.TABLE_SCHEMA
;

     SELECT [CustomerID]
          , [CompanyName]
          , [Region]
       FROM [dbo].[Customers]
      WHERE 1=1
   ORDER BY CASE WHEN [Region] IS NULL THEN 1
                ELSE 0
           END
          , [Region]
          , [CustomerID]
;
