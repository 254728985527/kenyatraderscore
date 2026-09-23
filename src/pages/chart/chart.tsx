import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
/* [AI] - Analytics removed - rudderstack event tracking removed */
/* [/AI] */
import ChunkLoader from '@/components/loader/chunk-loader';
import chart_api from '@/external/bot-skeleton/services/api/chart-api';
import { useSmartChartAdaptor } from '@/hooks/useSmartChartAdaptor';
import { useStore } from '@/hooks/useStore';
import { ChartTitle, SmartChart, TGranularity, TStateChangeListener } from '@deriv-com/smartcharts-champion';
import { useDevice } from '@deriv-com/ui';
import ToolbarWidgets from './toolbar-widgets';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';

type IndicatorKey = 'sma' | 'ema' | 'dema';

const movingAverage = (values: number[], period: number, exponential = false) => values.map((_, index) => {
    const start = Math.max(0, index - period + 1);
    const window = values.slice(start, index + 1);
    if (!exponential) return window.reduce((sum, value) => sum + value, 0) / window.length;
    const alpha = 2 / (period + 1);
    return window.reduce((average, value, windowIndex) => windowIndex === 0 ? value : value * alpha + average * (1 - alpha), window[0]);
});

const TechnicalIndicators = ({ symbol, getQuotes, subscribeQuotes }: { symbol: string; getQuotes: any; subscribeQuotes: any }) => {
    const [prices, setPrices] = useState<number[]>([]);
    const [active, setActive] = useState<Record<IndicatorKey, boolean>>({ sma: true, ema: true, dema: true });
    const periods = { sma: 14, ema: 9, dema: 21 };

    useEffect(() => {
        let mounted = true;
        let unsubscribe = () => {};
        getQuotes({ symbol, granularity: 0, count: 80 }).then((result: any) => {
            if (mounted) setPrices((result.history?.prices ?? []).map(Number).filter(Number.isFinite).slice(-80));
        }).catch(() => {});
        try {
            unsubscribe = subscribeQuotes({ symbol, granularity: 0 }, (quote: any) => {
                const price = Number(quote?.quote ?? quote?.price ?? quote?.Close ?? quote);
                if (mounted && Number.isFinite(price)) setPrices(current => [...current, price].slice(-80));
            });
        } catch { /* The chart remains usable if the stream is unavailable. */ }
        return () => { mounted = false; unsubscribe(); };
    }, [getQuotes, subscribeQuotes, symbol]);

    const lines = useMemo(() => ({
        sma: movingAverage(prices, periods.sma),
        ema: movingAverage(prices, periods.ema, true),
        dema: (() => { const ema = movingAverage(prices, periods.dema, true); return ema.map((_, index) => 2 * ema[index] - movingAverage(ema, periods.dema, true)[index]); })(),
    }), [prices]);
    const all = [...prices, ...lines.sma, ...lines.ema, ...lines.dema].filter(Number.isFinite);
    const min = Math.min(...all); const max = Math.max(...all); const range = max - min || 1;
    const points = (values: number[]) => values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${92 - ((value - min) / range) * 78}`).join(' ');

    return <div className='technical-indicators' aria-label='Technical indicators'><div className='technical-indicators__controls'><strong>Indicators</strong>{(['sma', 'ema', 'dema'] as IndicatorKey[]).map(key => <button key={key} type='button' className={active[key] ? `is-active indicator-${key}` : ''} onClick={() => setActive(current => ({ ...current, [key]: !current[key] }))}>{key.toUpperCase()} <small>{periods[key]}</small></button>)}</div><div className='technical-indicators__chart'><svg viewBox='0 0 100 100' preserveAspectRatio='none' aria-label='Live tick movement with moving averages'>{prices.length > 1 && <polyline points={points(prices)} fill='none' stroke='#4b6380' strokeWidth='.8' vectorEffect='non-scaling-stroke' />}{active.sma && <polyline points={points(lines.sma)} fill='none' stroke='#f59e0b' strokeWidth='1.2' vectorEffect='non-scaling-stroke' />}{active.ema && <polyline points={points(lines.ema)} fill='none' stroke='#1d8cf8' strokeWidth='1.2' vectorEffect='non-scaling-stroke' />}{active.dema && <polyline points={points(lines.dema)} fill='none' stroke='#e11d48' strokeWidth='1.2' vectorEffect='non-scaling-stroke' />}</svg></div></div>;
};

const Chart = observer(({ show_digits_stats }: { show_digits_stats: boolean }) => {
    const barriers: [] = [];
    const { common, ui } = useStore();
    const { chart_store, run_panel, dashboard } = useStore();
    const [isSafari, setIsSafari] = useState(false);

    const {
        chart_type,
        getMarketsOrder,
        granularity,
        onSymbolChange,
        setChartStatus,
        symbol,
        updateChartType,
        updateGranularity,
        updateSymbol,
    } = chart_store;

    // Use the custom hook for SmartChart Adaptor
    const { chartData, getQuotes, subscribeQuotes, unsubscribeQuotes } = useSmartChartAdaptor();

    const { isDesktop, isMobile } = useDevice();
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;

    const settings = {
        assetInformation: false, // ui.is_chart_asset_info_visible,
        countdown: true,
        isHighestLowestMarkerEnabled: false, // TODO: Pending UI,
        language: common.current_language.toLowerCase(),
        position: ui.is_chart_layout_default ? 'bottom' : 'left',
        theme: ui.is_dark_mode_on ? 'dark' : 'light',
    };

    useEffect(() => {
        // Safari browser detection using feature detection
        // More robust than user agent sniffing
        const isSafariBrowser = () => {
            // Check for Safari-specific features
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            // Additional check: Safari has specific webkit features
            const hasWebkitFeatures = 'webkitAudioContext' in window || 'WebKitMediaSource' in window;

            return isSafari && hasWebkitFeatures;
        };

        setIsSafari(isSafariBrowser());

        return () => {
            chart_api.api.forgetAll('ticks');
        };
    }, []);

    useEffect(() => {
        if (!symbol) updateSymbol();
    }, [symbol, updateSymbol]);

    const is_connection_opened = !!chart_api?.api;

    const handleStateChange: TStateChangeListener = (state, options) => {
        /* [AI] - Analytics removed - rudderstack event call removed */
        // Handle state changes: INITIAL, READY, SCROLL_TO_LEFT
        /* [/AI] */
        if (state === 'READY') {
            setChartStatus(true);
        }
    };

    if (!symbol || chartData.activeSymbols.length === 0) {
        return <ChunkLoader message='' />;
    }

    return (
        <div
            className={classNames('dashboard__chart-wrapper', {
                'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                'dashboard__chart-wrapper--safari': isSafari,
            })}
            dir='ltr'
        >
            <TechnicalIndicators symbol={symbol} getQuotes={getQuotes} subscribeQuotes={subscribeQuotes} />
            <SmartChart
                id={`dbot-${symbol}`}
                key={`chart-${symbol}`}
                barriers={barriers}
                showLastDigitStats={show_digits_stats}
                chartControlsWidgets={null}
                enabledChartFooter={false}
                stateChangeListener={handleStateChange}
                toolbarWidget={() => (
                    <ToolbarWidgets
                        updateChartType={updateChartType}
                        updateGranularity={updateGranularity}
                        position={!isDesktop ? 'bottom' : 'top'}
                        isDesktop={isDesktop}
                    />
                )}
                chartType={chart_type}
                isMobile={isMobile}
                enabledNavigationWidget={isDesktop}
                granularity={granularity as TGranularity}
                getQuotes={getQuotes}
                subscribeQuotes={subscribeQuotes}
                unsubscribeQuotes={unsubscribeQuotes}
                chartData={{ activeSymbols: chartData.activeSymbols, tradingTimes: chartData.tradingTimes }}
                settings={settings}
                symbol={symbol}
                topWidgets={() => <ChartTitle onChange={onSymbolChange} />}
                isConnectionOpened={is_connection_opened}
                getMarketsOrder={getMarketsOrder}
                isLive
                leftMargin={80}
                drawingToolFloatingMenuPosition={isMobile ? { x: 100, y: 100 } : { x: 200, y: 200 }}
            />
        </div>
    );
});

export default Chart;
