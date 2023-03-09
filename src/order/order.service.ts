import { Injectable, NotFoundException } from '@nestjs/common';
import { IExec } from 'iexec';
import { Order } from './order.model';
import {
  RequestorderTemplate,
  SignedRequestorder,
} from 'iexec/dist/lib/IExecOrderModule';

const iexec = new IExec({ ethProvider: window.ethereum });

@Injectable()
export class OrderService {
  async get_WorkerpoolOrder(category: number, workerpool_address: string) {
    const { orders } = await iexec.orderbook.fetchWorkerpoolOrderbook({
      category: category,
      workerpool: workerpool_address,
      minTag: ['tee'],
    });
    const workerpoolorder = orders[0]?.order;
    if (!workerpoolorder) throw Error(`no workerpoolorder found for the app `);
    else return workerpoolorder;
  }

  async get_DatasetOrder(
    dataset_address: string,
    app_address: string,
    workerpool_address: string,
  ) {
    const { orders: dsOrders } = await iexec.orderbook.fetchDatasetOrderbook(
      dataset_address,
      { app: app_address, workerpool: workerpool_address, minTag: ['tee'] },
    );
    const datasetOrder = dsOrders && dsOrders[0] && dsOrders[0].order;
    if (!datasetOrder) throw Error(`no apporder found for app`);
    else return datasetOrder;
  }

  async get_AppOrder(
    app_address: string,
    dataset_address: string,
    workerpool_address: string,
  ) {
    const { orders: appOrders } = await iexec.orderbook.fetchAppOrderbook(
      app_address,
      {
        dataset: dataset_address,
        workerpool: workerpool_address,
        minTag: ['tee'],
      },
    );
    const appOrder = appOrders && appOrders[0] && appOrders[0].order;
    if (!appOrder) throw Error(`no apporder found for app ${app_address}`);
    else console.log('found');
  }

  async create_RequestOrder(
    app_address: string,
    requester_address: string,
    args: string,
    secretName1: string,
    secretName2: string,
    dataset_address: string,
    workerpool_address: string,
  ) {
    const requestorderTemplate = await iexec.order.createRequestorder({
      app: app_address,
      requester: requester_address,
      volume: 1,
      category: 0,
      trust: 1,
      dataset: dataset_address,
      workerpool: workerpool_address,
      tag: [],
      params: {
        iexec_args: args,
        iexec_secrets: {
          '1': secretName1,
          '2': secretName2,
        },
      },
    });
    return requestorderTemplate;
  }

  async sign_requestOrder(requestorderTemplate: RequestorderTemplate) {
    const signedRequestorder = await iexec.order.signRequestorder(
      requestorderTemplate,
    );
    return signedRequestorder;
  }

  async publish_requestOrder(signedRequestorder: SignedRequestorder) {
    const requestOrderHash = await iexec.order.publishRequestorder(
      signedRequestorder,
    );
    return requestOrderHash;
  }

  async matchOrder(
    appOrder: any,
    signedRequestorder: any,
    workerpoolorder: any,
    datasetOrder: any,
  ) {
    const result = await iexec.order.matchOrders({
      apporder: appOrder,
      requestorder: signedRequestorder,
      workerpoolorder: workerpoolorder,
      datasetorder: datasetOrder,
    });
    const deal = await iexec.deal.show(result.dealid);
    const taskId = deal.tasks['0'];
    return taskId;
  }
}
