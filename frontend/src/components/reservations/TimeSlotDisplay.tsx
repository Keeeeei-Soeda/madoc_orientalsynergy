'use client'

import React from 'react'

export interface TimeSlotWithEmployee {
  slot: number;
  start_time: string;
  end_time: string;
  duration: number;
  is_filled: boolean;
  employee_id?: number;
  employee_name?: string;
  employee_department?: string;
  staff_name?: string; // スタッフ名も追加
}

interface TimeSlotDisplayProps {
  slots: TimeSlotWithEmployee[];
  hourlyRate?: number;
  onAssignEmployee?: (slotNumber: number) => void;
  onUnassignEmployee?: (slotNumber: number) => void;
  readOnly?: boolean;
  hideEmployeeInfo?: boolean; // スタッフ側で従業員情報を非表示にする
}

export default function TimeSlotDisplay({
  slots,
  hourlyRate,
  onAssignEmployee,
  onUnassignEmployee,
  readOnly = false,
  hideEmployeeInfo = false
}: TimeSlotDisplayProps) {
  if (!slots || slots.length === 0) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        時間枠が設定されていません。
      </div>
    )
  }

  const calculateSlotEarnings = (duration: number): number => {
    if (!hourlyRate) return 0
    return Math.floor((duration * hourlyRate) / 60)
  }

  return (
    <div className="row g-3">
      {slots.map((slot) => {
        const earnings = calculateSlotEarnings(slot.duration)
        // 割り当て済み判定: is_filledがtrue、または名前が設定されている
        // employee_idの有無に関わらず、名前があれば割り当て済みと判定
        const isAssigned = slot.is_filled || slot.employee_name || slot.staff_name

        return (
          <div key={slot.slot} className="col-12 col-md-6 col-lg-4">
            <div className={`card h-100 ${isAssigned ? 'border-success' : 'border-secondary'}`}>
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className={`badge ${isAssigned ? 'bg-success' : 'bg-secondary'}`}>
                  枠 {slot.slot}
                </span>
                {isAssigned ? (
                  <i className="bi bi-check-circle-fill text-success"></i>
                ) : (
                  <i className="bi bi-circle text-muted"></i>
                )}
              </div>
              <div className="card-body">
                {/* 時間帯 */}
                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-clock text-primary"></i>
                    <span className="fw-bold">{slot.start_time} 〜 {slot.end_time}</span>
                  </div>
                  <small className="text-muted">{slot.duration}分</small>
                </div>

                {/* 時給情報 */}
                {hourlyRate && hourlyRate > 0 && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-currency-yen text-success"></i>
                      <span className="text-success fw-bold">
                        {earnings.toLocaleString()}円
                      </span>
                    </div>
                    <small className="text-muted">時給 {hourlyRate.toLocaleString()}円</small>
                  </div>
                )}

                {/* 社員情報（hideEmployeeInfo=trueの場合は非表示） */}
                {!hideEmployeeInfo && (
                  <>
                    {isAssigned ? (
                      <div className="alert alert-success mb-0 p-2">
                        <div className="d-flex align-items-start justify-content-between">
                          <div className="flex-grow-1">
                            <div className="fw-bold">{slot.employee_name}</div>
                            {slot.employee_department && (
                              <small className="text-muted">{slot.employee_department}</small>
                            )}
                          </div>
                          {!readOnly && onUnassignEmployee && (
                            <button
                              onClick={() => onUnassignEmployee(slot.slot)}
                              className="btn btn-sm btn-outline-danger ms-2"
                              title="割り当て解除"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        {!readOnly && onAssignEmployee ? (
                          <button
                            onClick={() => onAssignEmployee(slot.slot)}
                            className="btn btn-outline-primary btn-sm w-100"
                          >
                            <i className="bi bi-person-plus me-1"></i>
                            社員を割り当て
                          </button>
                        ) : (
                          <span className="text-muted">未割り当て</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

