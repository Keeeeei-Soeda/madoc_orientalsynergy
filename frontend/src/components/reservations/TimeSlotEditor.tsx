'use client'

import React, { useState, useEffect } from 'react'
import { validateTimeSlots, formatDuration, formatCurrency, TimeSlot, ValidationResult } from '@/utils/timeSlotValidator'

interface TimeSlotEditorProps {
  startTime: string;
  endTime: string;
  initialServiceDuration?: number;
  initialBreakDuration?: number;
  initialHourlyRate?: number;
  hideEarnings?: boolean; // 金額・時給を非表示にする
  onDataChange: (data: {
    serviceDuration: number;
    breakDuration: number;
    hourlyRate: number;
    slotCount: number;
    slots: TimeSlot[];
    isValid: boolean;
  }) => void;
}

export default function TimeSlotEditor({
  startTime,
  endTime,
  initialServiceDuration = 30,
  initialBreakDuration = 10,
  initialHourlyRate = 1500,
  hideEarnings = false,
  onDataChange,
}: TimeSlotEditorProps) {
  const [serviceDuration, setServiceDuration] = useState<number>(initialServiceDuration);
  const [breakDuration, setBreakDuration] = useState<number>(initialBreakDuration);
  const [hourlyRate, setHourlyRate] = useState<number>(initialHourlyRate);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // リアルタイムバリデーション
  useEffect(() => {
    if (!startTime || !endTime) {
      setValidation(null);
      return;
    }

    const result = validateTimeSlots(startTime, endTime, serviceDuration, breakDuration, hourlyRate);
    setValidation(result);

    // 親コンポーネントに結果を通知
    onDataChange({
      serviceDuration,
      breakDuration,
      hourlyRate,
      slotCount: result.slotCount || 0,
      slots: result.slots || [],
      isValid: result.valid,
    });
  }, [startTime, endTime, serviceDuration, breakDuration, hourlyRate, onDataChange]);

  const handleServiceDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setServiceDuration(value);
  };

  const handleBreakDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setBreakDuration(value);
  };

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setHourlyRate(value);
  };

  return (
    <div className="time-slot-editor">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            時間枠設定
          </h5>
        </div>
        <div className="card-body">
          {/* 全体時間の表示 */}
          <div className="alert alert-info mb-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>予約時間:</strong> {startTime} 〜 {endTime}
            {validation && validation.availableTime && (
              <span className="ms-2">
                （全体: {formatDuration(validation.availableTime)}）
              </span>
            )}
          </div>

          {/* 入力フォーム */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label htmlFor="serviceDuration" className="form-label fw-bold">
                <i className="bi bi-scissors me-1"></i>
                施術時間（分）<span className="text-danger">*</span>
              </label>
              <input
                type="number"
                id="serviceDuration"
                className="form-control"
                min="1"
                max="300"
                value={serviceDuration}
                onChange={handleServiceDurationChange}
                placeholder="例: 30"
              />
              <small className="text-muted">1回の施術にかかる時間</small>
            </div>

            <div className="col-md-4">
              <label htmlFor="breakDuration" className="form-label fw-bold">
                <i className="bi bi-cup-hot me-1"></i>
                休憩時間（分）
              </label>
              <input
                type="number"
                id="breakDuration"
                className="form-control"
                min="0"
                max="60"
                value={breakDuration}
                onChange={handleBreakDurationChange}
                placeholder="例: 10"
              />
              <small className="text-muted">各枠の間の休憩時間</small>
            </div>

            {!hideEarnings && (
              <div className="col-md-4">
                <label htmlFor="hourlyRate" className="form-label fw-bold">
                  <i className="bi bi-currency-yen me-1"></i>
                  時給（円）<span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  className="form-control"
                  min="0"
                  step="100"
                  value={hourlyRate}
                  onChange={handleHourlyRateChange}
                  placeholder="例: 1500"
                />
                <small className="text-muted">スタッフへの報酬</small>
              </div>
            )}
          </div>

          {/* バリデーション結果の表示 */}
          {validation && (
            <div>
              {/* エラー表示 */}
              {!validation.valid && (
                <div className="alert alert-danger">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-exclamation-triangle fs-4 me-3 mt-1"></i>
                    <div className="flex-grow-1">
                      <h6 className="alert-heading mb-2">時間設定エラー</h6>
                      <p className="mb-2">{validation.error}</p>
                      
                      {validation.requiredTime && validation.availableTime && validation.excessTime && (
                        <div className="mt-3 p-3 bg-white rounded">
                          <div className="row g-2">
                            <div className="col-4">
                              <small className="text-muted">必要時間:</small>
                              <div className="fw-bold text-danger">
                                {formatDuration(validation.requiredTime)}
                              </div>
                            </div>
                            <div className="col-4">
                              <small className="text-muted">利用可能:</small>
                              <div className="fw-bold">
                                {formatDuration(validation.availableTime)}
                              </div>
                            </div>
                            <div className="col-4">
                              <small className="text-muted">超過:</small>
                              <div className="fw-bold text-danger">
                                {formatDuration(validation.excessTime)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3">
                        <strong><i className="bi bi-lightbulb me-1"></i>対処方法:</strong>
                        <ul className="mb-0 mt-1">
                          <li>施術時間を短くする</li>
                          <li>休憩時間を減らす</li>
                          <li>予約の全体時間を長くする</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 成功表示（プレビュー） */}
              {validation.valid && validation.slots && (
                <div className="alert alert-success">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-check-circle fs-4 me-3 mt-1"></i>
                    <div className="flex-grow-1">
                      <h6 className="alert-heading mb-3">予約枠プレビュー</h6>
                      
                      {/* サマリー */}
                      <div className="row g-3 mb-3">
                        <div className="col-md-3">
                          <div className="p-2 bg-white rounded text-center">
                            <small className="text-muted d-block">予約枠数</small>
                            <div className="fs-4 fw-bold text-primary">
                              {validation.slotCount}枠
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="p-2 bg-white rounded text-center">
                            <small className="text-muted d-block">使用時間</small>
                            <div className="fs-6 fw-bold">
                              {formatDuration(validation.usedTime || 0)}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="p-2 bg-white rounded text-center">
                            <small className="text-muted d-block">余り時間</small>
                            <div className="fs-6 fw-bold text-muted">
                              {formatDuration(validation.remainingTime || 0)}
                            </div>
                          </div>
                        </div>
                        {!hideEarnings && (
                          <div className="col-md-3">
                            <div className="p-2 bg-white rounded text-center">
                              <small className="text-muted d-block">総報酬</small>
                              <div className="fs-6 fw-bold text-success">
                                {validation.totalEarnings ? formatCurrency(validation.totalEarnings) : '-'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 各枠の詳細 */}
                      <div className="bg-white p-3 rounded">
                        <h6 className="mb-2">
                          <i className="bi bi-calendar-check me-2"></i>
                          各枠の時間帯
                        </h6>
                        <div className="row g-2">
                          {validation.slots.map((slot) => (
                            <div key={slot.slot} className="col-md-4">
                              <div className="border rounded p-2">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className="badge bg-primary">枠{slot.slot}</span>
                                  <small className="text-muted">{slot.duration}分</small>
                                </div>
                                <div className="mt-1 fw-bold">
                                  {slot.start_time} 〜 {slot.end_time}
                                </div>
                                {!hideEarnings && hourlyRate > 0 && (
                                  <div className="mt-1">
                                    <small className="text-success">
                                      <i className="bi bi-currency-yen"></i>
                                      {formatCurrency(Math.floor((slot.duration * hourlyRate) / 60))}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

