import * as React from 'react';
import PaypalExpressBtn from 'react-paypal-express-checkout';
import { message, Button } from 'antd';
import Router from 'next/router';
import config from '../../api/config';
import paypalConfig from '../../api/config/paypal.config';
import { getTransactionService } from '../../service-proxies/index';

class PaypalButton extends React.Component<any, any> {
  getAccessToken = async () => {
    let base64 = require('base-64');
    const result = await fetch(
      paypalConfig.paypal_variable.env === 'sandbox' ? `https://api.sandbox.paypal.com/v1/oauth2/token` : `https://api.paypal.com/v1/oauth2/token`, {
        method: 'POST',
        mode: "cors",
        credentials: "same-origin",
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': 'Basic ' + base64.encode(config.paypal.clientId + ":" + config.paypal.secret),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: 'grant_type=client_credentials',
      }
    );
    return (await result.json()).access_token;
  }

  getActivites = async () => {
    let accessToken = await this.getAccessToken();
    try {
      const result = await fetch(
        paypalConfig.paypal_variable.env === 'sandbox' ? `https://api.sandbox.paypal.com/v1/payments/payment?count=10&start_index=0&sort_by=create_time&sort_order=desc` : `https://api.paypal.com/v1/payments/payment?count=10&start_index=0&sort_by=create_time&sort_order=desc`, {
          method: 'GET',
          mode: "cors",
          credentials: "same-origin",
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          }
        }
      );
      return await result.json();
    } catch (err) {
      console.log(err.message);
    }
  }

  render() {
    const onSuccess = async (payment) => {
      this.props.informationTutorPageReducers.starting();
      let checkPaid = false;
      let transactionActivity: any = {};

      const activities = await this.getActivites();
      activities.payments.forEach((item) => {
        if (item.id === payment.paymentID) {
          if (item.payer && item.payer.status === "VERIFIED") {
            checkPaid === true;
            transactionActivity = item;
          }
        }
      });
      
      if (checkPaid = true) {
        if (this.props.isGroup) {
          this.props.onPaymentSuccess();
          await this.props.onPaymentGroupSuccess();
          await this.props.createOrUpdateNewGroupConversation({
            tutor: this.props.informationTutorPageState.groupInfo.tutor._id,
            student: this.props.profileState._id,
            studentName: this.props.profileState.fullName,
            groupTuition: this.props.informationTutorPageState.groupInfo._id,
          });
          let selectedCourse = this.props.informationTutorPageState.groupInfo;
          let sumPriceOfCourse = Number((selectedCourse.course.hourlyRate * selectedCourse.course.hourPerSession * selectedCourse.course.session / this.props.exchangeRate).toFixed(2));
          if (Object.keys(transactionActivity).length) {
            // Not null
          } else {
            // Null
            let sums = this.props.promoCode ? (this.props.promoCode.type === '%' ? (sumPriceOfCourse * (100 - this.props.promoCode.value) / 100) : (sumPriceOfCourse - Number((this.props.promoCode.value / this.props.exchangeRate).toFixed(2)))) : (sumPriceOfCourse ? sumPriceOfCourse : 0);
            transactionActivity = {
              id: payment.paymentID,
              intent: 'sale',
              state: 'approved',
              transactions: [
                {
                  amount: 
                  {
                    total: sums,
                    currency: this.props.currency ? this.props.currency : 'SGD',
                    details : {
                      subtotal: sums,
                    }
                  }
                }
              ]
    
              // ...
            };
          }
          await this.props.createNewTransaction();
          let payload = {
            transactionInfo: payment,
            paymentDetail: transactionActivity,
            groupTuition: this.props.informationTutorPageState.groupInfo._id,
            student: this.props.studentId,
            tutor: this.props.tutorId,
            startAmount: sumPriceOfCourse,
            option: this.props.informationTutorPageState.paymentOption
          } as any;
          if (this.props.promoCode) {
            payload = {
              ...payload,
              promoCode: this.props.promoCode._id
            } as any
          }
          const data = {
            ...payload.transactionInfo,
            paymentDetail: payload.paymentDetail,
            tuition: payload.tuition,
            groupTuition: payload.groupTuition,
            tutor: payload.tutor,
            student: payload.student,
            startAmount: payload.startAmount,
            totalAmount: payload.totalAmount,
            option: payload.option,
            isActive: true
          };
          const updatedData = payload.promoCode ? {
            ...data,
            promoCode: payload.promoCode
          } : data;
          const transactionService = getTransactionService();
          await transactionService.create(updatedData as any);
        } else {
          message.success(this.props.languageState.PAYPAL_BUTTON_BOOKING_SUCCESS.translated, 3);
          this.props.onPaymentSuccess();
          this.props.updatePaymentSuccess(this.props.idNewSchedules);

          const newBookings = this.props.newBookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map((booking) => ({
            start: new Date(booking.start).toUTCString(),
            end: new Date(booking.end).toUTCString(),
            type: 'student',
            owner: this.props.studentId,
            parent: this.props.tutorId,
            status: '',
            isPayment: false,
          }));
          const newTuitionInfo = {
            courseForTutor: this.props.selectedCourse._id,
            course: this.props.selectedCourse.course._id,
            student: this.props.studentId,
            tutor: this.props.tutorId,
          };
          let selectedCourse = this.props.informationTutorPageState.selectedCourse;
          let sumPriceOfCourse = this.props.informationTutorPageState.paymentOption === 'partiallyPay' ?
            Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * selectedCourse.course.session / this.props.exchangeRate).toFixed(2))
            : Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * this.props.newBookings.length / this.props.exchangeRate).toFixed(2));
          let totalAmountOfCourse = Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * this.props.newBookings.length / this.props.exchangeRate).toFixed(2));

          if (Object.keys(transactionActivity).length) {
            // Not null
          } else {
            // Null
            let sums = this.props.promoCode ? (this.props.promoCode.type === '%' ? (sumPriceOfCourse * (100 - this.props.promoCode.value) / 100) : (sumPriceOfCourse - Number((this.props.promoCode.value / this.props.exchangeRate).toFixed(2)))) : (sumPriceOfCourse ? sumPriceOfCourse : 0);
            transactionActivity = {
              id: payment.paymentID,
              intent: 'sale',
              state: 'approved',
              transactions: [
                {
                  amount: 
                  {
                    total: sums,
                    currency: this.props.currency ? this.props.currency : 'SGD',
                    details : {
                      subtotal: sums,
                    }
                  }
                }
              ]
    
              // ...
            };
          }
          await this.props.createNewTransaction();
          
          let payload = {
            transactionInfo: payment,
            paymentDetail: transactionActivity,
            tuition: this.props.tuitionId || undefined,
            student: this.props.studentId,
            tutor: this.props.tutorId,
            startAmount: sumPriceOfCourse,
            totalAmount : totalAmountOfCourse,
            option: this.props.informationTutorPageState.paymentOption,
          } as any;
          if (this.props.promoCode) {
            payload = {
              ...payload,
              promoCode: this.props.promoCode._id
            } as any
          }
          const data = {
            ...payload.transactionInfo,
            paymentDetail: payload.paymentDetail,
            tuition: payload.tuition,
            groupTuition: payload.groupTuition,
            tutor: payload.tutor,
            student: payload.student,
            startAmount: payload.startAmount,
            totalAmount: payload.totalAmount,
            option: payload.option,
            isActive: true
          };
          const updatedData = payload.promoCode ? {
            ...data,
            promoCode: payload.promoCode
          } : data;
          
          await this.props.createTuitionAndSessions({ newBookings, newTuitionInfo , option: this.props.informationTutorPageState.paymentOption, blockSize: selectedCourse.course.session, transactionData: updatedData });
        }

        this.props.informationTutorPageReducers.closePaymentModal();
        this.props.informationTutorPageReducers.clearState();
        this.props.clearPromoCode();
        Router.push('/my-tuition');
      }
    };

    const onSuccessDiscount = async () => {
      this.props.informationTutorPageReducers.starting();
      if (this.props.promoCode) {
        try {
          await this.props.useCode(this.props.promoCode._id);
          if (this.props.isGroup) {
            this.props.onPaymentSuccess();
            await this.props.onPaymentGroupSuccess();
            await this.props.createOrUpdateNewGroupConversation({
              tutor: this.props.informationTutorPageState.groupInfo.tutor._id,
              student: this.props.profileState._id,
              studentName: this.props.profileState.fullName,
              groupTuition: this.props.informationTutorPageState.groupInfo._id,
            });
            let selectedCourse = this.props.informationTutorPageState.groupInfo;
            let sumPriceOfCourse = Number((selectedCourse.course.hourlyRate * selectedCourse.course.hourPerSession * selectedCourse.course.session / this.props.exchangeRate).toFixed(2));
            let totalAmountOfCourse = Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * this.props.newBookings.length / this.props.exchangeRate).toFixed(2));
            const payload = {
              transactionInfo: {
                isDiscount100: true,
                paid: true,
                cancelled: false
              },
              paymentDetail: null,
              groupTuition: this.props.informationTutorPageState.groupInfo._id,
              student: this.props.studentId,
              tutor: this.props.tutorId,
              promoCode: this.props.promoCode._id,
              startAmount: sumPriceOfCourse,
              totalAmount: totalAmountOfCourse,
              option: this.props.informationTutorPageState.paymentOption
            } as any;
            const data = {
              ...payload.transactionInfo,
              paymentDetail: payload.paymentDetail,
              tuition: payload.tuition,
              groupTuition: payload.groupTuition,
              tutor: payload.tutor,
              student: payload.student,
              startAmount: payload.startAmount,
              totalAmount: payload.totalAmount,
              option: payload.option,
              isActive: true
            };
            const updatedData = payload.promoCode ? {
              ...data,
              promoCode: payload.promoCode
            } : data;
            const transactionService = getTransactionService();
            await transactionService.create(updatedData as any);
            this.props.informationTutorPageReducers.closePaymentModal();
            this.props.informationTutorPageReducers.clearState();
            this.props.clearPromoCode();
            Router.push('/my-tuition');
          } else {
            message.success(this.props.languageState.PAYPAL_BUTTON_BOOKING_SUCCESS.translated, 3);
            this.props.onPaymentSuccess();
            this.props.updatePaymentSuccess(this.props.idNewSchedules);

            const newBookings = this.props.newBookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).map((booking) => ({
              start: new Date(booking.start).toUTCString(),
              end: new Date(booking.end).toUTCString(),
              type: 'student',
              owner: this.props.studentId,
              parent: this.props.tutorId,
              status: '',
              isPayment: false,
            }));
            const newTuitionInfo = {
              courseForTutor: this.props.selectedCourse._id,
              course: this.props.selectedCourse.course._id,
              student: this.props.studentId,
              tutor: this.props.tutorId,
            };
            let selectedCourse = this.props.informationTutorPageState.selectedCourse;
            let sumPriceOfCourse = this.props.informationTutorPageState.paymentOption === 'partiallyPay' ?
              Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * selectedCourse.course.session / this.props.exchangeRate).toFixed(2))
              : Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * this.props.newBookings.length / this.props.exchangeRate).toFixed(2));
            let totalAmountOfCourse = Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * this.props.newBookings.length / this.props.exchangeRate).toFixed(2));
            await this.props.createNewTransaction();
            const payload = {
              transactionInfo: {
                isDiscount100: true,
                paid: true,
                cancelled: false
              },
              paymentDetail: null,
              tuition: this.props.tuitionId,
              student: this.props.studentId,
              tutor: this.props.tutorId,
              promoCode: this.props.promoCode._id,
              startAmount: sumPriceOfCourse,
              totalAmount: totalAmountOfCourse,
              option: this.props.informationTutorPageState.paymentOption
            } as any;
            const data = {
              ...payload.transactionInfo,
              paymentDetail: payload.paymentDetail,
              tuition: payload.tuition,
              groupTuition: payload.groupTuition,
              tutor: payload.tutor,
              student: payload.student,
              startAmount: payload.startAmount,
              totalAmount: payload.totalAmount,
              option: payload.option,
              isActive: true
            };
            const updatedData = payload.promoCode ? {
              ...data,
              promoCode: payload.promoCode
            } : data;
            
            await this.props.createTuitionAndSessions({ newBookings, newTuitionInfo, option: this.props.informationTutorPageState.paymentOption, blockSize: selectedCourse.course.session, transactionData: updatedData });

            this.props.informationTutorPageReducers.closePaymentModal();
            this.props.informationTutorPageReducers.clearState();
            this.props.clearPromoCode();
            Router.push('/my-tuition');
          }
        } catch (err) {
          message.error(err.message || this.props.languageState.PAYPAL_BUTTON_BOOKING_ERROR.translated);
        }
      } else {

      }
    };

    const onCancel = (_data) => message.error(this.props.languageState.PAYPAL_BUTTON_PAYMENT_CANCEL.translated, 4);

    const onError = (err) => message.error(err.error, 4);

    let selectedCourse: any;
    let sumPriceOfCourse: any;
    if (this.props.isGroup) {
      selectedCourse = this.props.informationTutorPageState.groupInfo;
      sumPriceOfCourse = Number((selectedCourse.course.hourlyRate * selectedCourse.course.hourPerSession * selectedCourse.course.session / this.props.exchangeRate).toFixed(2));
    } else {
      if (this.props.informationTutorPageState.selectedCourse.hourlyRate === undefined) {
        console.log('Current bookings have been deleted');
      } else {
        selectedCourse = this.props.informationTutorPageState.selectedCourse;
        sumPriceOfCourse = this.props.informationTutorPageState.paymentOption === 'partiallyPay' ?
          Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * selectedCourse.course.session / this.props.exchangeRate).toFixed(2))
          : Number((selectedCourse.hourlyRate * selectedCourse.course.hourPerSession * this.props.newBookings.length / this.props.exchangeRate).toFixed(2));
      }
    }

    let env = paypalConfig.paypal_variable.env;
    let currency = this.props.currency ? this.props.currency : 'SGD';
    let total = this.props.promoCode ? (this.props.promoCode.type === '%' ? (sumPriceOfCourse * (100 - this.props.promoCode.value) / 100) : (sumPriceOfCourse - Number((this.props.promoCode.value / this.props.exchangeRate).toFixed(2)))) : (sumPriceOfCourse ? sumPriceOfCourse : 0);
    const client = {
      sandbox: config.paypal.sandbox,
      production: config.paypal.production
    };
    return (
      <div className='paypal-btn-container' style={{ width: this.props.width, overflow: 'hidden' }}>
        <div style={{ opacity: total > 0 ? 1 : 0, overflow: 'hidden' }}>
          <PaypalExpressBtn
            env={env}
            client={client}
            currency={currency}
            total={total}
            onError={onError}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </div>
        {total > 0 ? <div></div> : <Button type="primary" onClick={() => onSuccessDiscount()}>{this.props.languageState.PAYPAL_BUTTON_PAY_NOW.translated}</Button>}
      </div>
    );
  }
}

export default PaypalButton;