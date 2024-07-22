import { Button } from '@affine/admin/components/ui/button';
import type { CarouselApi } from '@affine/admin/components/ui/carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@affine/admin/components/ui/carousel';
import { validateEmailAndPassword } from '@affine/admin/utils';
import { useQuery } from '@affine/core/hooks/use-query';
import { serverConfigQuery } from '@affine/graphql';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CreateAdmin } from './create-admin';

export enum CarouselSteps {
  Welcome = 0,
  CreateAdmin,
  SettingsDone,
}

const Welcome = () => {
  return (
    <div
      className="flex flex-col h-full w-full mt-60 max-lg:items-center max-lg:mt-16"
      style={{ minHeight: '300px' }}
    >
      <h1 className="text-5xl font-extrabold max-lg:text-3xl max-lg:font-bold">
        Welcome to AFFiNE
      </h1>
      <p className="mt-5 font-semibold text-xl max-lg:px-4 max-lg:text-lg">
        Configure your Self Host AFFiNE with a few simple settings.
      </p>
    </div>
  );
};

const SettingsDone = () => {
  return (
    <div
      className="flex flex-col h-full w-full mt-60 max-lg:items-center max-lg:mt-16"
      style={{ minHeight: '300px' }}
    >
      <h1 className="text-5xl font-extrabold max-lg:text-3xl max-lg:font-bold">
        All Settings Done
      </h1>
      <p className="mt-5 font-semibold text-xl max-lg:px-4 max-lg:text-lg">
        AFFiNE is ready to use.
      </p>
    </div>
  );
};

const CarouselItemElements = {
  [CarouselSteps.Welcome]: Welcome,
  [CarouselSteps.CreateAdmin]: CreateAdmin,
  [CarouselSteps.SettingsDone]: SettingsDone,
};

export const Form = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const navigate = useNavigate();

  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);

  const { data } = useQuery({
    query: serverConfigQuery,
  });
  const passwordLimits = data.serverConfig.credentialsRequirement.password;

  const isCreateAdminStep = current - 1 === CarouselSteps.CreateAdmin;

  const disableContinue =
    (!nameValue || !emailValue || !passwordValue) && isCreateAdminStep;

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const onNext = useCallback(() => {
    if (
      isCreateAdminStep &&
      !validateEmailAndPassword(
        emailValue,
        passwordValue,
        passwordLimits,
        setInvalidEmail,
        setInvalidPassword
      )
    ) {
      return;
    }
    if (current === count) {
      return navigate('/', { replace: true });
    }

    api?.scrollNext();
  }, [
    api,
    count,
    current,
    emailValue,
    isCreateAdminStep,
    navigate,
    passwordLimits,
    passwordValue,
  ]);

  const onPrevious = useCallback(() => {
    if (current === count) {
      return navigate('/admin', { replace: true });
    }
    api?.scrollPrev();
  }, [api, count, current, navigate]);

  return (
    <div className="flex flex-col justify-between h-full w-full  lg:pl-36 max-lg:items-center ">
      <Carousel
        setApi={setApi}
        className=" h-full w-full"
        opts={{ watchDrag: false }}
      >
        <CarouselContent>
          {Object.entries(CarouselItemElements).map(([key, Element]) => (
            <CarouselItem key={key}>
              <Element
                name={nameValue}
                email={emailValue}
                password={passwordValue}
                invalidEmail={invalidEmail}
                invalidPassword={invalidPassword}
                passwordLimits={passwordLimits}
                onNameChange={setNameValue}
                onEmailChange={setEmailValue}
                onPasswordChange={setPasswordValue}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div>
        {current > 1 && (
          <Button className="mr-3" onClick={onPrevious} variant="outline">
            {current === count ? 'Goto Admin Panel' : 'Back'}
          </Button>
        )}
        <Button onClick={onNext} disabled={disableContinue}>
          {current === count ? 'Open AFFiNE' : 'Continue'}
        </Button>
      </div>

      <div className="py-2 px-0 text-sm mt-16 max-lg:mt-5 relative">
        {Array.from({ length: count }).map((_, index) => (
          <span
            key={index}
            className={`inline-block w-16 h-1 rounded mr-1 ${
              index <= current - 1
                ? 'bg-primary'
                : 'bg-muted-foreground opacity-20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
