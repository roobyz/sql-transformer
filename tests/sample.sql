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

 create or replace view tag_policies as
WITH
     tags AS (SELECT a.*
                FROM snowflake.account_usage.tags a
               WHERE 1=1
                 AND a.deleted is null
             ) ,
     masking_policies AS (SELECT *
                            FROM snowflake.account_usage.masking_policies
                           WHERE 1=1
                             AND deleted is null
                         ) ,
     column_info AS (SELECT b.policy_name
                          , b.ref_entity_name AS table_nm
                          , array_agg(DISTINCT b.ref_column_name) within group (ORDER BY b.ref_column_name) AS attributes
                      from ( SELECT a.policy_name
                                  , a.ref_column_name
                                  , a.ref_entity_name
                               FROM information_schema.policy_references a
                   GROUP BY 1, 2) b)

--  Outcome
     SELECT b.policy_id             AS tag_policy_id
          , b.policy_name           AS masking_policy_nm
          , a.tag_name              AS tag_nm
          , a.tag_schema            AS schema
          , a.tag_database          AS database
          , c.table_nm
          , c.masked_attributes
          , b.policy_body::string   AS masking_sql
       FROM tags a
       JOIN masking_policies b
         ON a.tag_schema_id   = b.policy_schema_id
        AND a.tag_database_id = b.policy_catalog_id
       JOIN column_info c
         ON b.policy_name = c.policy_name
;

WITH -- the CTE view name
source 
    AS (
        SELECT
             {{ surrogate_key_int(['PROD_CORP.DIV_NBR','PROD_CORP.PROD_NBR']) }}::int as DIM_PROD_SK
            ,{{ surrogate_key_int(['PIM_USF_STD_PROD_CD']) }}::int as PIM_SK
            ,DIV_NBR as MKT_NBR
            ,PROD_NBR
            ,case when prod_corp.prtry_item_ind = 'Y' then TRUE when prod_corp.prtry_item_ind = 'N' then FALSE else null end::boolean  as PRTRY_ITEM_IND
            ,PROD_BRND
            ,MFR_PROD_NBR
            ,case when prod_corp.CTCH_WT_IND = 'Y' then TRUE when prod_corp.CTCH_WT_IND = 'N' then FALSE else null end::boolean as CTCH_WT_IND
            ,SLS_UOM
            ,PRC_UOM
            ,DFP_CD
            ,AP_VNDR_NBR
            ,PRCH_FROM_VNDR_NBR
            ,case when prod_corp.BRK_IND = 'Y' then TRUE when prod_corp.BRK_IND = 'N' then FALSE else null end::boolean as BRK_IND
            ,PROD_NBR_CASE
            ,LAST_PROD_COST
            ,PRTN_UOM
            ,PRTN_CONV_FCTR
            ,case when prod_corp.MKT_CD_IND = 'Y' then TRUE when prod_corp.MKT_CD_IND = 'N' then FALSE else null end::boolean as MKT_CD_IND
            ,CMDTY_IND
            ,PROD_SHLF_LIFE
            ,LRG_ORD_QTY
            ,case when prod_corp.PROD_RSRVBL_IND = 'Y' then TRUE when prod_corp.PROD_RSRVBL_IND = 'N' then FALSE else null end::boolean as PROD_RSRVBL_IND
            ,SUB_CONV_FCTR_1
            ,HIGH_ACPT_TMPRTR
            ,case when prod_corp.VNDR_SMALL_BUS_IND  = 'Y' then TRUE when prod_corp.VNDR_SMALL_BUS_IND = 'N' then FALSE else null end::boolean as VNDR_SMALL_BUS_IND
            ,PRPRTRY_CUST_NBR
            ,PRPRTRY_CUST_NM
            ,VNDR_TI
            ,VNDR_HI
            ,STRTGC_SUB
            ,STRTGC_CORE
           ,case when prod_corp.CSH_CRY_BRKR_IND  = 'Y' then TRUE when prod_corp.CSH_CRY_BRKR_IND = 'N' then FALSE else null end::boolean as CSH_CRY_BRKR_IND
            ,UPD_FRCST_IND
            ,FUT_MRKT_COST_PRC_EFF_DT
            ,FUT_MRKT_COST_UPD_DT
            ,null::varchar(20) as SRC_CRT_USR_ID
            ,null::varchar(20) as SRC_UPD_USR_ID
            ,null::timestamp_ntz as SRC_CRT_TS
            ,null::timestamp_ntz as SRC_UPD_TS
            ,null::timestamp_ntz as CDW_CRT_TS
            ,null::timestamp_ntz as CDW_UPD_TS
            ,null::char(5) as DBT_REV_NBR
            ,null::timestamp_ntz as DBT_MDL_CRT_TS
            ,null::timestamp_ntz as DBT_MDL_UPD_TS
        FROM {{ ref('prod') }}
    )
SELECT * FROM source
;


-- Issue: spacing for “between”
WITH
FISC_YR_MTH_RANGE AS (SELECT DISTINCT FISC_YR
            , FISC_YR_MTH
            , FISC_MTH_OF_YR
            , CASE WHEN FISC_YR_MTH BETWEEN (SELECT FISC_YR_MTH
                                              FROM GOLD.XDMADM.TIME_CORP
                                             WHERE 1=1
                                               AND CLNDR_DT = DATEADD('month', -12, CURRENT_DATE))
                    AND (SELECT FISC_YR_MTH
                           FROM GOLD.XDMADM.TIME_CORP
                          WHERE 1=1
                            AND CLNDR_DT = DATEADD('month', -1, CURRENT_DATE))
                   THEN 'L12'
                   WHEN FISC_YR_MTH BETWEEN (SELECT FISC_YR_MTH -300
                                              FROM GOLD.XDMADM.TIME_CORP
                                             WHERE 1=1
                                               AND CLNDR_DT = DATEADD('month', -12, CURRENT_DATE))
                    AND (SELECT FISC_YR_MTH -300
                           FROM GOLD.XDMADM.TIME_CORP
                          WHERE 1=1
                            AND CLNDR_DT = DATEADD('month', -1, CURRENT_DATE))
                   THEN 'PRIOR L12'
              END AS TIME_PERIOD
    FROM GOLD.XDMADM.TIME_CORP
   WHERE 1=1
     AND TIME_PERIOD is not null)

select * from FISC_YR_MTH_RANGE
;


create
       or replace table CDW_DEV.SANDBOX_Z7T6026.MTH_PMO_SPOIL_DAM_BASE (
          FISC_YR
        , FISC_YR_MTH
        , FISC_MTH_OF_YR
        , FISC_MTH_YR
        , MARKET_TYPE_NM
        , RGN_NM
        , AREA_NM
        , DIV_NM_CD_NBR
        , COMP_BASE
        , METRIC
        , TOTAL_EXT_AMT
        , TOTAL_EXT_AMT_LY
        , MERLIN_CASES
        , MERLIN_CASES_LY
          ) as (
               with FISC_YR_MTH_RANGE as (
                       select distinct FISC_YR
                            , FISC_YR_MTH
                            , FISC_MTH_OF_YR
                            , case
                                             when FISC_YR_MTH between (
                                           select FISC_YR_MTH
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -12, current_date)
                                        ) and (
                                           select FISC_YR_MTH
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -1, current_date)
                                        )  then 'L12'
                                             when FISC_YR_MTH between (
                                           select FISC_YR_MTH -300
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -12, current_date)
                                        ) and (
                                           select FISC_YR_MTH -300
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -1, current_date)
                                        )  then 'PRIOR L12'
                              end as TIME_PERIOD
                         from GOLD.XDMADM.TIME_CORP
                        where 1=1
                          and TIME_PERIOD is not null
                    )
                  , INV_ADJ as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , S."GL Category"
                            , sum(S."Total Ext Amt") as TOTAL_EXT_AMT
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='L12'
                          and S."GL Category"<>'SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , S."GL Category"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )

select * from INV_ADJ
;

 
-- Issue: inner join bug and block line block comments
create
       or replace table CDW_DEV.SANDBOX_Z7T6026.MTH_PMO_SPOIL_DAM_BASE (
          FISC_YR
        , FISC_YR_MTH
        , FISC_MTH_OF_YR
        , FISC_MTH_YR
        , MARKET_TYPE_NM
        , RGN_NM
        , AREA_NM
        , DIV_NM_CD_NBR
        , COMP_BASE
        , METRIC
        , TOTAL_EXT_AMT
        , TOTAL_EXT_AMT_LY
        , MERLIN_CASES
        , MERLIN_CASES_LY
          ) as (
               with FISC_YR_MTH_RANGE as (
                       select distinct FISC_YR
                            , FISC_YR_MTH
                            , FISC_MTH_OF_YR
                            , case
                                             when FISC_YR_MTH between (
                                           select FISC_YR_MTH
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -12, current_date)
                                        ) and (
                                           select FISC_YR_MTH
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -1, current_date)
                                        )  then 'L12'
                                             when FISC_YR_MTH between (
                                           select FISC_YR_MTH -300
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -12, current_date)
                                        ) and (
                                           select FISC_YR_MTH -300
                                             from GOLD.XDMADM.TIME_CORP
                                            where 1=1
                                              and CLNDR_DT=DATEADD ('month', -1, current_date)
                                        )  then 'PRIOR L12'
                              end as TIME_PERIOD
                         from GOLD.XDMADM.TIME_CORP
                        where 1=1
                          and TIME_PERIOD is not null
                    )
                  , INV_ADJ as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , S."GL Category"
                            , sum(S."Total Ext Amt") as TOTAL_EXT_AMT
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='L12'
                          and S."GL Category"<>'SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , S."GL Category"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )
                  , INV_ADJ_TOT as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , sum(S."Total Ext Amt") as TOTAL_EXT_AMT
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='L12'
                          and S."GL Category"<>'SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )
                  , INV_ADJ_VOL as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , sum(S."MerlinCases") as MERLIN_CASES
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='L12'
                          and S."GL Category"='SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )

                  , INV_ADJ_LY as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , S."GL Category"
                            , sum(S."Total Ext Amt") as TOTAL_EXT_AMT
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='PRIOR L12'
                          and S."GL Category"<>'SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , S."GL Category"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )
                  , INV_ADJ_TOT_LY as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , sum(S."Total Ext Amt") as TOTAL_EXT_AMT
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='PRIOR L12'
                          and S."GL Category"<>'SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )
                  , INV_ADJ_VOL_LY as (
                       select S."Fiscal Year" as FISC_YR
                            , S."Fiscal Period" as FISC_MTH_OF_YR
                            , sum(S."MerlinCases") as MERLIN_CASES
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                         from SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY s
                        inner join GOLD.XDMADM.DIV_CORP D on S."Market Number"=D.DIV_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on S."Market Number"=am.DIV_NBR
                        inner join FISC_YR_MTH_RANGE fyw on S."Fiscal Year Period"=fyw.FISC_YR_MTH
                        where am.MARKET_TYPE_CD in ('BLD', 'ACQ')
                          and fyw.TIME_PERIOD='PRIOR L12'
                          and S."GL Category"='SALES'
                     group by S."Fiscal Year"
                            , S."Fiscal Period"
                            , d.DIV_NM_CD_NBR
                            , D.AREA_NM
                            , D.RGN_NM
                    )

                    -- ---------------------------------------------------------
                    --                          BASE                           
                    -- ---------------------------------------------------------
​
                  , INV_ADJ_BASE as (
                       select T.FISC_YR
                            , T.FISC_YR_MTH
                            , T.FISC_MTH_OF_YR
                            , 'MTH '||T.FISC_MTH_OF_YR as FISC_MTH_YR
                            , AM.MARKET_TYPE_NM
                            , S.RGN_NM
                            , S.AREA_NM
                            , S.DIV_NM_CD_NBR
                            , S."GL Category" as METRIC
                            , sum(S.TOTAL_EXT_AMT) as TOTAL_EXT_AMT
                            , '0' as TOTAL_EXT_AMT_LY
                            , sum(a.MERLIN_CASES) as MERLIN_CASES
                            , '0' as MERLIN_CASES_LY
                         from INV_ADJ as S
                    left join INV_ADJ_VOL as A on S.FISC_YR=A.FISC_YR
                          and S.FISC_MTH_OF_YR=A.FISC_MTH_OF_YR
                          and S.DIV_NM_CD_NBR=A.DIV_NM_CD_NBR
                        inner join GOLD.XDMADM.TIME_CORP T on S.FISC_YR=T.FISC_YR
                          and S.FISC_MTH_OF_YR=T.FISC_MTH_OF_YR
                        inner join GOLD.XDMADM.DIV_CORP D on S.DIV_NM_CD_NBR=D.DIV_NM_CD_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on D.DIV_NBR=am.DIV_NBR
                     group by T.FISC_YR
                            , T.FISC_YR_MTH
                            , T.FISC_MTH_OF_YR
                            , AM.MARKET_TYPE_NM
                            , S.DIV_NM_CD_NBR
                            , S.AREA_NM
                            , S.RGN_NM
                            , S."GL Category"
                    -- -------------------------------------------------
                        union
                    -- -------------------------------------------------
                       select T.FISC_YR+3 as FISC_YR
                            , T.FISC_YR_MTH+300 as FISC_YR_MTH
                            , T.FISC_MTH_OF_YR
                            , 'MTH '||T.FISC_MTH_OF_YR as FISC_MTH_YR
                            , AM.MARKET_TYPE_NM
                            , S.RGN_NM
                            , S.AREA_NM
                            , S.DIV_NM_CD_NBR
                            , S."GL Category" as METRIC
                            , '0' as TOTAL_EXT_AMT
                            , sum(S.TOTAL_EXT_AMT) as TOTAL_EXT_AMT_LY
                            , '0' as MERLIN_CASES
                            , sum(a.MERLIN_CASES) as MERLIN_CASES_LY
                         from INV_ADJ_LY as S
                    left join INV_ADJ_VOL_LY as A on S.FISC_YR=A.FISC_YR
                          and S.FISC_MTH_OF_YR=A.FISC_MTH_OF_YR
                          and S.DIV_NM_CD_NBR=A.DIV_NM_CD_NBR
                        inner join GOLD.XDMADM.TIME_CORP T on S.FISC_YR=T.FISC_YR
                          and S.FISC_MTH_OF_YR=T.FISC_MTH_OF_YR
                        inner join GOLD.XDMADM.DIV_CORP D on S.DIV_NM_CD_NBR=D.DIV_NM_CD_NBR
                        inner join BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am on D.DIV_NBR=am.DIV_NBR
                     group by T.FISC_YR
                            , T.FISC_YR_MTH
                            , T.FISC_MTH_OF_YR
                            , AM.MARKET_TYPE_NM
                            , S.DIV_NM_CD_NBR
                            , S.AREA_NM
                            , S.RGN_NM
                            , S."GL Category"
                    )
                    -- -----------------------------------------------------------------
                    --                             OUTCOME                             
                    -- -----------------------------------------------------------------
             select FISC_YR
                  , FISC_YR_MTH
                  , FISC_MTH_OF_YR
                  , FISC_MTH_YR
                  , MARKET_TYPE_NM
                  , RGN_NM
                  , AREA_NM
                  , DIV_NM_CD_NBR
                  , '2019' as COMP_BASE
                  , METRIC
                  , sum(TOTAL_EXT_AMT) TOTAL_EXT_AMT
                  , sum(TOTAL_EXT_AMT_LY) TOTAL_EXT_AMT_LY
                  , sum(MERLIN_CASES) MERLIN_CASES
                  , sum(MERLIN_CASES_LY) MERLIN_CASES_LY
               from INV_ADJ_BASE
           group by FISC_YR
                  , FISC_YR_MTH
                  , FISC_MTH_OF_YR
                  , FISC_MTH_YR
                  , MARKET_TYPE_NM
                  , RGN_NM
                  , AREA_NM
                  , DIV_NM_CD_NBR
                  , METRIC
          );
 
-- Issue: case after select
WITH
     USAGE_PARSED AS (
         SELECT split_part(CLIENT_APPLICATION_ID, ' ', 0) AS CLIENT_APPLICATION_ID
              , PARSE_JSON(CLIENT_ENVIRONMENT):OS::string AS PJ_OS
              , PARSE_JSON(CLIENT_ENVIRONMENT):APPLICATION::string AS PJ_APPLICATION
              , PARSE_JSON(CLIENT_ENVIRONMENT):BROWSER_VERION::string AS PJ_BROWSER
              , ROLE_NAME
              , WAREHOUSE_NAME
              , USER_NAME
              , CLIENT_ENVIRONMENT
              , QUERY_ID
           FROM "BUSINESS_ANALYTICS"."PERFORMANCE_CHECKS"."BIM_ACCT_USAGE"
          WHERE 1=1
            AND end_time >= DATEADD(Day, -30, current_date))
   , USAGE_TRANSFORMED AS (
         SELECT CASE WHEN PJ_APPLICATION LIKE '%alation%' THEN 'Alation'
                     WHEN PJ_APPLICATION LIKE '%Tableau%' THEN 'Tableau'
                     WHEN PJ_APPLICATION LIKE '%org%'
                      AND PJ_OS like 'amzn1' THEN 'AWS Linux'
                     WHEN PJ_APPLICATION LIKE '%amazonaws%' THEN 'AWS'
                     WHEN PJ_APPLICATION LIKE '%amazon%' THEN 'AWS'
                     WHEN PJ_APPLICATION LIKE '%PythonConnector%'
                     THEN 'PythonConnector'
                     WHEN PJ_APPLICATION LIKE '%SnowSQL%' THEN 'SnowSQL'
                     WHEN PJ_APPLICATION LIKE 'dbt' THEN 'dbt'
                     WHEN PJ_APPLICATION LIKE '%EXCELEX%' OR PJ_APPLICATION LIKE '%EXCEL%'
                     THEN 'Excel'
                     WHEN PJ_APPLICATION LIKE '%MSACCES%' THEN 'MS Access'
                     WHEN PJ_APPLICATION LIKE '%Alteryx%' THEN 'Alteryx'
                     WHEN PJ_APPLICATION LIKE '%MashupEnginePowerBI%' OR PJ_APPLICATION LIKE '%Microsoft.Mashup.Container%'
                     THEN 'PowerBI'
                     WHEN PJ_APPLICATION LIKE '%apache.catalina%'
                     THEN 'Catalina Salesforce'
                     WHEN PJ_APPLICATION LIKE '%org.mule.runtime.module.reboot.MuleContainerBootstrap%'
                     THEN 'Mule Salesforce'
                     WHEN PJ_APPLICATION LIKE '%ADDINS%' THEN 'Microsoft Add-ins'
                     WHEN PJ_APPLICATION LIKE '%powershell%' OR PJ_APPLICATION LIKE '%PowerShell%'
                     THEN 'PowerShell'
                     WHEN PJ_APPLICATION LIKE '%kafka%' THEN 'Kafka'
                     WHEN PJ_APPLICATION LIKE '%intellij%' THEN 'Java Intellij'
                     WHEN PJ_APPLICATION LIKE '%DataGuru%' THEN 'Data Guru'
                     WHEN PJ_APPLICATION LIKE '%forgerock.openidm%'
                     THEN 'openidm'
                     WHEN PJ_APPLICATION LIKE '%AutomationAnywhereEnterprise%'
                     THEN 'Automation Anywhere Enterprise'
                     WHEN PJ_APPLICATION LIKE '%Rscript%'or PJ_APPLICATION LIKE '%RStudio%'
                     THEN 'Rstudio'
                     WHEN PJ_APPLICATION LIKE '%surefirebooter%' THEN 'Surefire Booter'
                     WHEN PJ_APPLICATION LIKE '%nqsserver%' THEN 'ORACLE OBIS (OBIEE)'
                     WHEN PJ_APPLICATION LIKE '%MashupEngine%' THEN 'Microsoft tool connection (Power Query or similar)'
                     WHEN PJ_APPLICATION LIKE '%dinesh%' OR PJ_APPLICATION LIKE '%Dinesh%'
                     THEN 'Individual User: Dinesh'
                     WHEN split_part(CLIENT_APPLICATION_ID, ' ', 0) ='Snowflake'
                     THEN 'Snowflake'
                     WHEN PJ_APPLICATION IS NULL THEN 'OTHER:' || split_part(CLIENT_APPLICATION_ID, ' ', 0)
                     ELSE PJ_APPLICATION
                END AS APPLICATION
              , CLIENT_ENVIRONMENT
              , ROLE_NAME
              , WAREHOUSE_NAME
              , USER_NAME
              , QUERY_ID
           FROM USAGE_PARSED)
   , USAGE_FINAL AS (
         SELECT ROLE_NAME
              , WAREHOUSE_NAME
              , USER_NAME
              , CLIENT_ENVIRONMENT
              , QUERY_ID
              , CASE WHEN APPLICATION IN ('Alteryx', 'Data Guru', 'dbt', 'Fivetran', 'isql', 'Kafka', 'mobilize.net'
                                        , 'Quest_ToadDataPoint', 'org.apache.spark.deploy.SparkSubmit', 'ORACLE OBIS (OBIEE)'
                                        , 'CInformatica1051clientsPowerCenterClientclientbinp', 'pmdtm','INFA_IICS')
                       OR APPLICATION LIKE 'EOracle%'
                     THEN 'ETL'
                     WHEN APPLICATION IN ('Automation Anywhere Enterprise','CData_Software')
                     THEN 'Enterprise Automation'
                     WHEN APPLICATION IN ('com.install4j.runtime.launcher.MacLauncher', 'cucumber.api.cli.Main', 'openidm'
                                        , 'Java Intellij','org.testng.remote.RemoteTestNG', 'OTHER:JDBC', 'Surefire Booter'
                                        , 'weblogic.Server')
                     THEN 'Java'
                     WHEN APPLICATION IN ('Excel', 'Microsoft Add-ins', 'MS Access', 'PowerBI', 'PowerShell'
                                        , 'Microsoft tool connection (Power Query or similar)')
                     THEN 'Microsoft Tools'
                     WHEN APPLICATION IN ('Catalina Salesforce', 'com.sforce.connector.WaveAgentMain', 'Mule Salesforce')
                     THEN 'Salesforce'
                     ELSE APPLICATION
                END AS APPLICATION_TYPE
              , APPLICATION
           FROM USAGE_TRANSFORMED)
 
--  Outcome
     SELECT APPLICATION_TYPE
          , ROLE_NAME
          -- , WAREHOUSE_NAME
          , COUNT(DISTINCT USER_NAME) AS QTY_USERS
          , COUNT(Query_ID) AS QTY_QUERIES
       FROM USAGE_FINAL
   GROUP BY 1, 2
   ORDER BY QTY_QUERIES DESC
;



create or replace view VW_WKLY_PMO_SPOIL_DAM_BASE(
                    FISC_YR,
                    FISC_YR_MTH,
                    FISC_WK_OF_PRD,
                    FISC_MTH_OF_YR,
                    FISC_WK_OF_YR,
                    FISC_YR_WK,
                    DIV_NM_CD_NBR,
                    MARKET_TYPE_NM,
                    AREA_NM,
                    RGN_NM,
                    LW_FLAG,
                    L4_FLAG,
                    L13_FLAG,
                   COMP_BASE,
                    METRIC,
                    TOTAL_EXT_AMT,
                    TOTAL_EXT_AMT_LY,
                    MERLIN_CASES,
                    MERLIN_CASES_LY
) as (
​WITH TIME_FLGS AS (
select max(clndr_dt) max_clndr_dt,
  max(case when CLNDR_DT = DATEADD('days', -7, CURRENT_DATE) THEN '1' ELSE '0' END) as LW_FLAG,
  max(case when CLNDR_DT > DATEADD('days', -28, CURRENT_DATE) and CLNDR_DT < DATEADD('days', -7, CURRENT_DATE) HEN '1' ELSE '0' END) as L4_FLAG,
  max(case when CLNDR_DT > DATEADD('days', -91, CURRENT_DATE) and CLNDR_DT < DATEADD('days', -7, CURRENT_DATE) THEN '1' ELSE '0' END) as L13_FLAG,
  FISC_WK_OF_YR
from gold.xdmadm.time_corp
where CLNDR_DT > DATEADD('days', -91, CURRENT_DATE) and CLNDR_DT < CURRENT_DATE --made a change
group by FISC_WK_OF_YR) 
, FISC_YR_WK_RANGE AS (
SELECT DISTINCT FISC_YR_WK ,CASE WHEN FISC_YR_WK BETWEEN (SELECT FISC_YR_WK FROM GOLD.XDMADM.TIME_CORP WHERE CLNDR_DT = CURRENT_DATE - 91)
                                                             AND (SELECT FISC_YR_WK FROM GOLD.XDMADM.TIME_CORP WHERE CLNDR_DT = CURRENT_DATE - 7)
                                         THEN 'L13'
                      WHEN FISC_YR_WK BETWEEN (SELECT FISC_YR_WK - 300 FROM GOLD.XDMADM.TIME_CORP WHERE CLNDR_DT = CURRENT_DATE - 91) //cesare 4/8/22 update for 2019
                                                             AND (SELECT FISC_YR_WK - 300 FROM GOLD.XDMADM.TIME_CORP WHERE CLNDR_DT = CURRENT_DATE - 7) //cesare 4/8/22 update for 2019
                                         THEN 'PRIOR L13'
                    END AS TIME_PERIOD
FROM GOLD.XDMADM.TIME_CORP
WHERE TIME_PERIOD IS NOT NULL 
)
, INV_ADJ AS (
  SELECT
S."Fiscal Year" AS FISC_YR
,S."Fiscal Week" AS  FISC_WK_OF_YR
,S."GL Category"  
,SUM(S."Total Ext Amt") AS TOTAL_EXT_AMT
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
  FROM SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY  s
  INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S."Market Number" = D.DIV_NBR
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am
ON S."Market Number"  = am.DIV_NBR
INNER JOIN FISC_YR_WK_RANGE fyw
ON S."Fiscal Year Week" = fyw.FISC_YR_WK
where am.MARKET_TYPE_CD IN ('BLD', 'ACQ') 
AND fyw.TIME_PERIOD = 'L13'              
AND S."GL Category"  <> 'SALES' 
group by
S."Fiscal Year"
,S."Fiscal Week"
,S."GL Category"  
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM )
, INV_ADJ_TOT as (
  SELECT
S."Fiscal Year" AS FISC_YR
,S."Fiscal Week" AS  FISC_WK_OF_YR
,SUM(S."Total Ext Amt") AS TOTAL_EXT_AMT
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
 FROM SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY  s
  INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S."Market Number" = D.DIV_NBR
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am
ON S."Market Number"  = am.DIV_NBR
INNER JOIN FISC_YR_WK_RANGE fyw
ON S."Fiscal Year Week" = fyw.FISC_YR_WK
where am.MARKET_TYPE_CD IN ('BLD', 'ACQ')   
AND fyw.TIME_PERIOD = 'L13'  
AND S."GL Category"  <> 'SALES'  
group by
S."Fiscal Year"
,S."Fiscal Week"
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM)
, INV_ADJ_VOL as (
  SELECT
S."Fiscal Year" AS FISC_YR
,S."Fiscal Week" AS FISC_WK_OF_YR
,SUM(S."MerlinCases") AS MERLIN_CASES
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
 FROM SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY  s
  INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S."Market Number" = D.DIV_NBR
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am
ON S."Market Number"  = am.DIV_NBR
INNER JOIN FISC_YR_WK_RANGE fyw
ON S."Fiscal Year Week" = fyw.FISC_YR_WK
where am.MARKET_TYPE_CD IN ('BLD', 'ACQ')  
AND fyw.TIME_PERIOD = 'L13'
AND S."GL Category"  = 'SALES'  
group by
S."Fiscal Year"
,S."Fiscal Week"
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
)
// START OF LY 
, INV_ADJ_LY AS (
  SELECT
S."Fiscal Year" AS FISC_YR
,S."Fiscal Week" AS  FISC_WK_OF_YR
,S."GL Category"  
,SUM(S."Total Ext Amt") AS TOTAL_EXT_AMT
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
  FROM SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY  s
  INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S."Market Number" = D.DIV_NBR
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am
ON S."Market Number"  = am.DIV_NBR
INNER JOIN FISC_YR_WK_RANGE fyw
ON S."Fiscal Year Week" = fyw.FISC_YR_WK
where am.MARKET_TYPE_CD IN ('BLD', 'ACQ')   
AND fyw.TIME_PERIOD = 'PRIOR L13'                
AND S."GL Category"  <> 'SALES' 
group by
S."Fiscal Year"
,S."Fiscal Week"
,S."GL Category"  
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM )
, INV_ADJ_TOT_LY as (
  SELECT
S."Fiscal Year" AS FISC_YR
,S."Fiscal Week" AS  FISC_WK_OF_YR
,SUM(S."Total Ext Amt") AS TOTAL_EXT_AMT
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
  FROM SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY  s
  INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S."Market Number" = D.DIV_NBR
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am
ON S."Market Number"  = am.DIV_NBR
INNER JOIN FISC_YR_WK_RANGE fyw
ON S."Fiscal Year Week" = fyw.FISC_YR_WK
where am.MARKET_TYPE_CD IN ('BLD', 'ACQ')   
AND  fyw.TIME_PERIOD = 'PRIOR L13'   
AND S."GL Category"  <> 'SALES'  
group by
S."Fiscal Year"
,S."Fiscal Week"
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM)
, INV_ADJ_VOL_LY as (
  SELECT
S."Fiscal Year" AS FISC_YR
,S."Fiscal Week" AS FISC_WK_OF_YR
,SUM(S."MerlinCases") AS MERLIN_CASES
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
  FROM SUPPLY_CHAIN.SUPPLY_CHAIN.IA_CATEGORY_SUMMARY  s
  INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S."Market Number" = D.DIV_NBR
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am
ON S."Market Number"  = am.DIV_NBR
INNER JOIN FISC_YR_WK_RANGE fyw
ON S."Fiscal Year Week" = fyw.FISC_YR_WK
where am.MARKET_TYPE_CD IN ('BLD', 'ACQ')  
AND fyw.TIME_PERIOD = 'PRIOR L13'
AND S."GL Category"  = 'SALES'  
group by
S."Fiscal Year"
,S."Fiscal Week"
,d.DIV_NM_CD_NBR
,D.AREA_NM
,D.RGN_NM
) 
 , INV_ADJ_BASE AS (
    select
  T.FISC_YR
, T.FISC_YR_MTH
, T.FISC_MTH_OF_YR
 , T.FISC_WK_OF_PRD
, T.FISC_YR_WK   
 ,'WK '||T.FISC_WK_OF_YR as FISC_WK_OF_YR
,AM.MARKET_TYPE_NM 
 , W.LW_FLAG
, W.L4_FLAG 
 , W.L13_FLAG
,S.DIV_NM_CD_NBR
 ,S.AREA_NM
,S.RGN_NM
,S."GL Category"  AS METRIC
,SUM(S.TOTAL_EXT_AMT) AS TOTAL_EXT_AMT
,'0' AS TOTAL_EXT_AMT_LY
,SUM(a.MERLIN_CASES) AS MERLIN_CASES
,'0' AS MERLIN_CASES_LY
   FROM INV_ADJ AS S
   LEFT JOIN INV_ADJ_VOL AS A ON 
     S.FISC_YR          =     A.FISC_YR
AND S.FISC_WK_OF_YR    =           A.FISC_WK_OF_YR
AND S.DIV_NM_CD_NBR    =         A.DIV_NM_CD_NBR
 INNER JOIN GOLD.XDMADM.TIME_CORP T ON S.FISC_YR = T.FISC_YR AND S.FISC_WK_OF_YR = T.FISC_WK_OF_YR
 INNER JOIN TIME_FLGS W
ON T.FISC_WK_OF_YR = W.FISC_WK_OF_YR
INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S.DIV_NM_CD_NBR = D.DIV_NM_CD_NBR 
 INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am    
 ON D.DIV_NBR = am.DIV_NBR  
   GROUP BY
  T.FISC_YR
, T.FISC_YR_MTH
, T.FISC_MTH_OF_YR
 , T.FISC_WK_OF_PRD
, T.FISC_YR_WK   
 ,T.FISC_WK_OF_YR
,AM.MARKET_TYPE_NM 
 , W.LW_FLAG
, W.L4_FLAG 
 , W.L13_FLAG   
 ,S.DIV_NM_CD_NBR
 ,S.AREA_NM
,S.RGN_NM
,S."GL Category"
   UNION
   select
 T.FISC_YR + 3 AS FISC_YR //cesare 4/8/22 update for 2019
, T.FISC_YR_MTH + 300 AS FISC_YR_MTH //cesare 4/8/22 update for 2019
, T.FISC_MTH_OF_YR
, T.FISC_WK_OF_PRD
, T.FISC_YR_WK + 300 AS FISC_YR_WK    //cesare 4/8/22 update for 2019
,'WK '||T.FISC_WK_OF_YR as FISC_WK_OF_YR
,AM.MARKET_TYPE_NM 
, W.LW_FLAG
, W.L4_FLAG 
, W.L13_FLAG
,S.DIV_NM_CD_NBR
,S.AREA_NM
,S.RGN_NM
,S."GL Category"  AS METRIC
,'0' AS TOTAL_EXT_AMT
,SUM(S.TOTAL_EXT_AMT) AS TOTAL_EXT_AMT_LY
,'0' AS MERLIN_CASES
,SUM(a.MERLIN_CASES) AS MERLIN_CASES_LY
  FROM INV_ADJ_LY AS S
  LEFT JOIN INV_ADJ_VOL_LY AS A ON 
    S.FISC_YR          =      A.FISC_YR
AND S.FISC_WK_OF_YR    =            A.FISC_WK_OF_YR
AND S.DIV_NM_CD_NBR    =          A.DIV_NM_CD_NBR
INNER JOIN GOLD.XDMADM.TIME_CORP T ON S.FISC_YR = T.FISC_YR AND S.FISC_WK_OF_YR = T.FISC_WK_OF_YR
INNER JOIN TIME_FLGS W
ON T.FISC_WK_OF_YR = W.FISC_WK_OF_YR
INNER JOIN GOLD.XDMADM.DIV_CORP D
ON S.DIV_NM_CD_NBR = D.DIV_NM_CD_NBR   
INNER JOIN BUSINESS_ANALYTICS.ANALYTICS.VIEW_ACTIVE_MARKETS am    
ON D.DIV_NBR = am.DIV_NBR    
  GROUP BY
 T.FISC_YR
, T.FISC_YR_MTH
, T.FISC_MTH_OF_YR
, T.FISC_WK_OF_PRD
, T.FISC_YR_WK   
,T.FISC_WK_OF_YR
,AM.MARKET_TYPE_NM 
, W.LW_FLAG
, W.L4_FLAG 
, W.L13_FLAG   
,S.DIV_NM_CD_NBR
,S.AREA_NM
,S.RGN_NM
,S."GL Category"
) 
SELECT
FISC_YR
,FISC_YR_MTH
,FISC_WK_OF_PRD
,FISC_MTH_OF_YR
,FISC_WK_OF_YR  
,FISC_YR_WK
,DIV_NM_CD_NBR
,MARKET_TYPE_NM  
,AREA_NM
,RGN_NM
,LW_FLAG   
,L4_FLAG     
,L13_FLAG   
,'2019' as COMP_BASE //cesare 4/8/22 for 2019 data
,METRIC
,SUM(TOTAL_EXT_AMT) TOTAL_EXT_AMT
,SUM(TOTAL_EXT_AMT_LY) TOTAL_EXT_AMT_LY
,SUM(MERLIN_CASES) MERLIN_CASES
,SUM(MERLIN_CASES_LY) MERLIN_CASES_LY
FROM INV_ADJ_BASE
GROUP BY
FISC_YR
,FISC_YR_MTH
,FISC_WK_OF_PRD
,FISC_MTH_OF_YR
,FISC_WK_OF_YR  
,FISC_YR_WK
,DIV_NM_CD_NBR
,MARKET_TYPE_NM  
,AREA_NM
,RGN_NM
,LW_FLAG   
,L4_FLAG     
,L13_FLAG
,METRIC)
;
