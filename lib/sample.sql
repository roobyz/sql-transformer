WITH
     budget AS (SELECT DISTINCT SRC
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
                     , FIRST_VALUE(BUDGET) OVER (PARTITION BY SRC, MRKT_CHANNEL, SRC_AGGRTR, PROG, PROG_TYPE, REG_SUB_REG, MRKT, KEYWORD_CAT, TARGETING_TACTIC, BUDGET_START_DT, BUDGET_END_DT, GOAL
                                                ORDER BY MODIFIED_AT) AS BUDGET_FCT_AMT
                     , LAST_VALUE(BUDGET) OVER (PARTITION BY SRC, MRKT_CHANNEL, SRC_AGGRTR, PROG, PROG_TYPE, REG_SUB_REG, MRKT, KEYWORD_CAT, TARGETING_TACTIC, BUDGET_START_DT, BUDGET_END_DT, GOAL
                                               ORDER BY MODIFIED_AT) AS BUDGET_FNL_AMT
                  FROM budget_goals)
         ,
     budget_el AS (SELECT DISTINCT SRC
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
                    WHERE 1=1
                      AND PROG_TYPE = 'EL'),
     budget_all AS (SELECT SRC
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
                         , max(GOAL) AS GOAL
                         , SUM(CASE WHEN KEYWORD_CAT = 'Brand'
                                     AND PROG = 'lob' THEN BUDGET_FNL_AMT
                                    ELSE NULL
                               END) AS EL_BND_lob
                         , SUM(CASE WHEN KEYWORD_CAT = 'Brand'
                                     AND PROG = 'Product' THEN BUDGET_FNL_AMT
                                    ELSE NULL
                               END) AS EL_BND_MED
                         , SUM(CASE WHEN KEYWORD_CAT = 'Brand'
                                     AND PROG = 'B2B' THEN BUDGET_FNL_AMT
                                    ELSE NULL
                               END) AS EL_BND_B2B
                         , SUM(CASE WHEN KEYWORD_CAT = 'Non-Brand'
                                     AND PROG = 'lob' THEN BUDGET_FNL_AMT
                                    ELSE NULL
                               END) AS EL_NBND_lob
                         , SUM(CASE WHEN KEYWORD_CAT = 'Non-Brand'
                                     AND PROG = 'Brand Advertising'
                                    THEN BUDGET_FNL_AMT
                                    ELSE NULL
                               END) AS EL_NBND_BND
                      FROM budget_el
                  GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
                     UNION ALL
                    SELECT SRC
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
                         , max(GOAL) AS GOAL
                         , NULL AS EL_BND_lob
                         , NULL AS EL_BND_MED
                         , NULL AS EL_BND_B2B
                         , NULL AS EL_NBND_lob
                         , NULL AS EL_NBND_BND
                      FROM BUDGET
                     WHERE 1=1
                       AND COALESCE(upper(PROG_TYPE), 'CORE') = 'CORE'
                  GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
                   ),
     fnl AS (SELECT BUDGET_DT
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
               FROM budget_all)
/* Outcome */
     SELECT *
       FROM fnl
;

